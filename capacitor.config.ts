import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jeremy.dx1synth',
  appName: 'DX1 Synth',
  webDir: 'dist',
  backgroundColor: '#0c0c0e',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    backgroundColor: '#0c0c0e',
  },
};

export default config;
