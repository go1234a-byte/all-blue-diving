import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allblue.diving',
  appName: 'ALL BLUE',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
  },
};

export default config;
