import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      // so a camada de regra de negocio entra na conta (ver README)
      include: ['src/services/**/*.service.ts', 'src/rules/**/*.rules.ts'],
    },
  },
});
