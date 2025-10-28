# Pomodoro App (React + Vite + Capacitor)

A Pomodoro timer with 25/5 work/break cycles, local notifications, and haptics.

## Requirements
- Node.js 18+
- npm 9+
- (For Android) Android Studio or Android SDK + adb

## Install
```bash
npm i
```

## Run (Web)
```bash
npm run dev
# open http://localhost:5173
```

## Build (Web)
```bash
npm run build
# output in dist/
```

## Android (Capacitor)
```bash
# Build web assets
npm run build

# Sync web + plugins to native
npx cap sync

# Open Android project (requires Android Studio)
npx cap open android
```
Run the app from Android Studio (emulator or device).

## CLI Android build (optional)
```bash
cd android
./gradlew assembleDebug
adb install -r ./app/build/outputs/apk/debug/app-debug.apk
```

## Project Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

## Structure
- `src/` React app source
- `dist/` build output
- `android/` native Android project
- `capacitor.config.ts` Capacitor config
