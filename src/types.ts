// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * subset of node.js types, safe to use in browser and bundlers
 * we do not use `lib.dom` types because they are not available in SSR environment
 */
declare global {
  const process: { env: { NODE_ENV?: string } };
  const console: { warn: (...args: Array<any>) => void };
}

// dummy export to make typescript treat this file as ES module
export {};
