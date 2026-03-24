import Constants from 'expo-constants';

/**
 * Resolves the backend API base URL automatically.
 *
 * Priority order:
 *  1. EXPO_PUBLIC_API_URL env var — use this in production or to override
 *  2. Expo manifest hostUri — auto-detects the dev machine's LAN IP at runtime
 *     (works for any developer without manual IP configuration)
 *  3. localhost fallback — web browser / simulator on same machine
 */
export function getApiUrl(): string {
  // 1. Explicit override (production URL or manual override)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl !== 'auto') {
    return envUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // 2. Extract host from Expo's own manifest — this is the IP Expo is
  //    already using for the Metro bundler, so it's guaranteed reachable
  //    from whatever device scanned the QR code.
  const hostUri =
    Constants.expoConfig?.hostUri ??        // Expo SDK 46+
    (Constants.manifest as any)?.debuggerHost ?? // older SDKs
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const host = hostUri.split(':')[0]; // strip the Metro port (:8081)
    return `http://${host}:3000`;
  }

  // 3. Last resort — works in web browser and iOS/Android simulator
  return 'http://localhost:3000';
}
