import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.openclaw.nodi',
  appName: 'Nod.i',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F0F23',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#0F0F23',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
