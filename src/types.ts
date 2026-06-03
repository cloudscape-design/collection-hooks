// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Minimal global type shims for environments without @types/node.
 * Only declare types not provided by lib.dom to avoid conflicts.
 */
declare global {
  const process: { env: { NODE_ENV?: string } };
}

// dummy export to make typescript treat this file as ES module
export {};
