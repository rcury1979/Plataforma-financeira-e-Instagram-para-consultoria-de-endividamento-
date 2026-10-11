import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rmconsultoriaeducation.app',
  appName: 'R&M 360',
  webDir: 'dist',
  server: process.env.CAPACITOR_LIVE_RELOAD === 'true' ? {
    url: 'https://22c35114-6423-4d97-8022-2be64c76dacf.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  } : undefined,
};

export default config;
