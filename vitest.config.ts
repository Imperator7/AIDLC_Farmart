import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        // Backend unit tests: pure functions (validation, http helpers, search helpers, dates). No database.
        resolve: { alias: { '@': path.join(dirname, 'src') } },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/server/__tests__/unit/**/*.test.ts', 'scripts/**/__tests__/unit/**/*.test.ts'],
          setupFiles: ['src/server/__tests__/setup.ts'],
          env: { FARMART_DB: ':memory:' },
        },
      },
      {
        // Backend integration tests: route handler → validation → repository → SQLite, and the OpenAPI contract.
        // Each test file gets its own freshly seeded in-memory database (see setup-db.ts).
        // The seed (scripts/seed) is tested here too.
        resolve: { alias: { '@': path.join(dirname, 'src') } },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/server/__tests__/integration/**/*.test.ts', 'scripts/**/__tests__/integration/**/*.test.ts'],
          setupFiles: ['src/server/__tests__/setup.ts', 'src/server/__tests__/setup-db.ts'],
          env: { FARMART_DB: ':memory:' },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            // Vitest's default (63315) is in Windows' dynamic port range, which Hyper-V/WinNAT reserves in blocks
            // that change between reboots ("listen EACCES ::1:63315", and every story test silently skipped).
            api: { port: 6106 },
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    // Coverage measures the backend only (stories cover the UI). `npm run test:report` writes everything to reports/.
    coverage: {
      provider: 'v8',
      include: [
        'src/server/**/*.ts',
        'scripts/seed/**/*.ts',
        'src/lib/search.ts',
        'src/lib/cart.ts',
        'src/lib/dev-tools.ts',
        'src/proxy.ts',
        'src/app/e2e/_components/load-e2e.ts',
        'src/app/api/**/route.ts',
        'src/app/docs/openapi.json/route.ts',
        'src/app/database-er-diagram/**/route.ts',
      ],
      // cli.ts only reads flags and prints; it is checked by running the commands.
      exclude: ['src/server/__tests__/**', 'scripts/**/__tests__/**', 'scripts/seed/cli.ts'],
      // json + json-summary feed the /test-report page; html is the full line-by-line report.
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: 'reports/coverage',
    },
  },
});
