// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      enabled: process.env.CI === 'true',
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['**/debug-tools/**', '**/test/**'],
    },
  },
});
