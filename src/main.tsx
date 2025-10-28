// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

async function bootstrapCapacitor() {
  try {
    // Xin quyền thông báo
    await LocalNotifications.requestPermissions()

    // Android: tạo notification channel để dùng âm tuỳ chọn
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'pomodoro_channel',
        name: 'Pomodoro',
        description: 'Alerts for work/break sessions',
        importance: 5, // max
        sound: 'your_sound', // file your_sound.mp3 trong res/raw (không kèm đuôi)
        visibility: 1, // public
        lights: true,
        vibration: true,
      })
    }
  } catch (err) {
    // tránh crash
    console.warn('Init notifications failed', err)
  }
}

bootstrapCapacitor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)