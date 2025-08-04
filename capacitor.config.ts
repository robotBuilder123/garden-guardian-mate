import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2fc42e32231748beaa97612856367269',
  appName: 'garden-guardian-mate',
  webDir: 'dist',
  server: {
    url: "https://2fc42e32-2317-48be-aa97-612856367269.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;