// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * subset of node.js types, safe to use in browser and bundlers
 */
declare global {
  const process: { env: { NODE_ENV?: string } };
}

// dummy export to make typescript treat this file as ES module
export {};
