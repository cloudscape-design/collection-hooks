#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

const shims = [
  { target: './mjs/index.d.ts', out: './index.d.ts' },
  { target: './mjs/operations.d.ts', out: './operations.d.ts' },
  { target: './mjs/internal-do-not-use.d.ts', out: './internal-do-not-use.d.ts' },
];

for (const { out, target } of shims) {
  if (!fs.existsSync(join(root, target))) {
    throw new Error(`Missing target declaration file: ${target}`);
  }
  fs.writeFileSync(join(root, out), `export * from "${target.replace(/\.d\.ts$/, '')}";\n`, 'utf8');
}
