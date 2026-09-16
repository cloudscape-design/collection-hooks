// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import headerPlugin from '@tony.ganchev/eslint-plugin-header';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tsEslint from 'typescript-eslint';
import vitestPlugin from '@vitest/eslint-plugin';

import cloudscapeBuildTools from '@cloudscape-design/build-tools/eslint/index.js';

export default tsEslint.config(
  includeIgnoreFile(path.resolve('.gitignore')),
  {
    ignores: ['lib/**', 'coverage/**'],
  },
  {
    settings: {
      react: { version: 'detect' },
    },
  },
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactHooksPlugin.configs['recommended-latest'],
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@cloudscape-design/build-tools': cloudscapeBuildTools,
      unicorn: unicornPlugin,
      header: headerPlugin,
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@cloudscape-design/build-tools/no-internal-in-public-interfaces': 'error',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'unicorn/filename-case': 'error',
      curly: 'error',
      eqeqeq: 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'header/header': [
        'error',
        'line',
        [' Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.', ' SPDX-License-Identifier: Apache-2.0'],
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.{test,spec}.{ts,tsx}', 'test/**'],
    ...vitestPlugin.configs.recommended,
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
    },
  },
  eslintPrettier
);
