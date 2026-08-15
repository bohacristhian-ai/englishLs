import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Domain logic must stay runnable without a DOM; jsdom is only for components.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
