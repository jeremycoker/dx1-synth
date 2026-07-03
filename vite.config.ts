import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required: AudioWorklet (and Web MIDI) only work in secure contexts,
// and this app is accessed via the NAS IP, not localhost.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    // Empty proxy forces HTTP/1.1 over TLS instead of HTTP/2 — more compatible
    // with NAS networking / reverse proxies.
    proxy: {},
  },
});
