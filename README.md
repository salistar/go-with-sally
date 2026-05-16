# Go With Sally - Mobile App

Women-only ride-hailing mobile app for Morocco 🚗💖🇲🇦

## Prerequisites

- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Set your API server IP address
3. Set your Google Maps API key

```bash
cp .env.example .env
```

Edit `.env`:
```
API_URL=http://YOUR_SERVER_IP:5000
SOCKET_URL=http://YOUR_SERVER_IP:5000
GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

## Running

Start the development server:
```bash
npx expo start
```

Run on iOS:
```bash
npx expo run:ios
```

Run on Android:
```bash
npx expo run:android
```

## Building

Create a development build:
```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

## Features

- 🔐 Phone & Face verification
- 🗺️ Real-time map with driver tracking
- 💬 In-app chat
- 🆘 SOS emergency button
- 📱 QR code verification
- 🌍 Multi-language (FR/AR/EN)
- 🌙 Dark mode support

## Tech Stack

- Expo SDK 52
- React Native 0.76
- Redux Toolkit
- React Navigation
- Socket.IO
- i18next
