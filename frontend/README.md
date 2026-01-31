# HeritageAI Frontend

React Native Expo mobile application for HeritageAI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `EXPO_PUBLIC_API_URL`: Your backend API URL (e.g., `http://localhost:3000`)

4. Start the development server:
```bash
npm start
```

## Features

- **Home Screen**: Browse and search stories with filters
- **Story View**: Read stories in storybook mode or watch in video mode
- **Recording Screen**: Record or upload audio stories with metadata

## Development

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # Screen components
│   ├── services/       # API and Supabase services
│   └── config/         # Configuration files
├── App.tsx             # Main app component
└── package.json
```

## Notes

- Make sure your backend API is running before testing upload functionality
- For Android, you may need to configure network security to allow localhost connections
- For iOS, you may need to configure Info.plist for microphone permissions
