// src/hooks/usePomodoro.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LocalNotifications, type LocalNotification } from '@capacitor/local-notifications'
import { Dialog } from '@capacitor/dialog'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

type SessionType = 'work' | 'break'

type PomodoroSession = {
  id: string
  type: SessionType
  startedAt: number
  endedAt: number
  durationSec: number
}

const WORK_DURATION_SEC = 25 * 60
const BREAK_DURATION_SEC = 5 * 60
const STORAGE_KEY = 'pomodoro_sessions_v1'

export function usePomodoro() {
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [isRunning, setIsRunning] = useState(false)
  const [remainingSec, setRemainingSec] = useState<number>(WORK_DURATION_SEC)
  const [targetEndTs, setTargetEndTs] = useState<number | null>(null)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const startTsRef = useRef<number | null>(null)
  const tickerRef = useRef<number | null>(null)

  // Load lịch sử
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setSessions(JSON.parse(raw))
      }
    } catch {
        console.error('loadSessions failed')
    }
  }, [])

  // Save lịch sử
  const persistSessions = useCallback((next: PomodoroSession[]) => {
    setSessions(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
        console.error('persistSessions failed', next)
    }
  }, [])

  const sessionDurationSec = useMemo(
    () => (sessionType === 'work' ? WORK_DURATION_SEC : BREAK_DURATION_SEC),
    [sessionType],
  )

  const resetToType = useCallback((type: SessionType) => {
    setSessionType(type)
    setIsRunning(false)
    setTargetEndTs(null)
    setRemainingSec(type === 'work' ? WORK_DURATION_SEC : BREAK_DURATION_SEC)
    startTsRef.current = null
  }, [])

  const scheduleEndNotification = useCallback(async (type: SessionType) => {
    // Lập lịch thông báo tức thời (hoặc sau 1s để chắc chắn render)
    const title = type === 'work' ? 'Hết phiên làm việc' : 'Hết phiên nghỉ'
    const body =
      type === 'work'
        ? 'Đã đến lúc nghỉ 5 phút.'
        : 'Hết giờ nghỉ, quay lại 25 phút làm việc nhé.'
    try {
      const notif: LocalNotification = {
        id: Date.now(),
        title,
        body,
        schedule: { at: new Date(Date.now() + 500) },
        smallIcon: 'ic_stat_icon', // tuỳ chỉnh nếu có
      }

      if (Capacitor.getPlatform() === 'android') {
        notif.channelId = 'pomodoro_channel'
      } else {
        // iOS: âm tuỳ chọn nếu đã thêm file vào bundle
        // notif.sound = 'your_sound.caf'
      }

      await LocalNotifications.schedule({ notifications: [notif] })
    } catch (err) {
      console.warn('Schedule notification failed', err)
    }
  }, [])

  const vibrate = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch {
      console.error('vibrate failed')
    }
  }, [])

  const finishSession = useCallback(async () => {
    // Lưu lịch sử
    const endTs = Date.now()
    const startTs = startTsRef.current ?? endTs - sessionDurationSec * 1000
    const entry: PomodoroSession = {
      id: String(endTs),
      type: sessionType,
      startedAt: startTs,
      endedAt: endTs,
      durationSec: sessionDurationSec,
    }
    persistSessions([entry, ...sessions])

    // Rung + thông báo
    await vibrate()
    await scheduleEndNotification(sessionType)

    // Hỏi tiếp tục
    const nextType: SessionType = sessionType === 'work' ? 'break' : 'work'
    const { value } = await Dialog.confirm({
      title: 'Chuyển phiên?',
      message:
        sessionType === 'work'
          ? 'Bắt đầu nghỉ 5 phút?'
          : 'Bắt đầu làm việc 25 phút?',
      okButtonTitle: 'Bắt đầu',
      cancelButtonTitle: 'Để sau',
    })

    if (value) {
      // Bắt đầu phiên mới
      setSessionType(nextType)
      setIsRunning(true)
      const duration = nextType === 'work' ? WORK_DURATION_SEC : BREAK_DURATION_SEC
      startTsRef.current = Date.now()
      setTargetEndTs(Date.now() + duration * 1000)
      setRemainingSec(duration)
    } else {
      resetToType(nextType)
    }
  }, [
    persistSessions,
    scheduleEndNotification,
    sessionType,
    sessions,
    sessionDurationSec,
    vibrate,
    resetToType,
  ])

  // Tick: dựa trên targetEndTs để chạy chuẩn trong nền
  useEffect(() => {
    if (!isRunning || !targetEndTs) return

    const tick = () => {
      const now = Date.now()
      const sec = Math.max(0, Math.floor((targetEndTs - now) / 1000))
      setRemainingSec(sec)
      if (sec <= 0) {
        setIsRunning(false)
        setTargetEndTs(null)
        finishSession()
      }
    }

    // tick sớm + interval
    tick()
    const id = window.setInterval(tick, 500)
    tickerRef.current = id
    return () => {
      window.clearInterval(id)
      tickerRef.current = null
    }
  }, [isRunning, targetEndTs, finishSession])

  const start = useCallback(() => {
    if (isRunning) return
    const duration = sessionDurationSec
    startTsRef.current = Date.now()
    setTargetEndTs(Date.now() + duration * 1000)
    setRemainingSec(duration)
    setIsRunning(true)
  }, [isRunning, sessionDurationSec])

  const pause = useCallback(() => {
    if (!isRunning || !targetEndTs) return
    // Tính lại remaining tại thời điểm pause
    const now = Date.now()
    const sec = Math.max(0, Math.floor((targetEndTs - now) / 1000))
    setRemainingSec(sec)
    setTargetEndTs(null)
    setIsRunning(false)
  }, [isRunning, targetEndTs])

  const reset = useCallback(() => {
    resetToType(sessionType)
  }, [resetToType, sessionType])

  const switchType = useCallback(() => {
    const nextType: SessionType = sessionType === 'work' ? 'break' : 'work'
    resetToType(nextType)
  }, [resetToType, sessionType])

  const clearHistory = useCallback(() => {
    persistSessions([])
  }, [persistSessions])

  const minutes = Math.floor(remainingSec / 60)
  const seconds = remainingSec % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return {
    sessionType,
    isRunning,
    formatted,
    remainingSec,
    start,
    pause,
    reset,
    switchType,
    sessions,
    clearHistory,
  }
}