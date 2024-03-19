#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cjsRoot = join(__dirname, '../lib/cjs');
const packageJsonPath = join(cjsRoot, 'package.json');
const packageJsonContent = `{
  "type": "commonjs"
}`;

writeFileSync(packageJsonPath, packageJsonContent);
