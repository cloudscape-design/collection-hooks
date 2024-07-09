#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const libDir = path.join(rootDir, 'lib');
const packageJsonPath = path.join(rootDir, 'package.json');
const libPackageJsonPath = path.join(libDir, 'package.json');

// Read the original package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Add the files array
packageJson.files = ['cjs', 'mjs', 'package.json', 'README.md', 'LICENSE', 'NOTICE'];

// Write the modified package.json to the lib directory
fs.writeFileSync(libPackageJsonPath, JSON.stringify(packageJson, null, 2));
