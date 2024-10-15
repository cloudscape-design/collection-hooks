// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Allow use of `process.env.NODE_ENV` specifically.
 */
declare const process: { env: { NODE_ENV?: string } };

const isDevelopment = process.env.NODE_ENV !== 'production';

const messageCache = new Set<string>();

export function warnOnce(message: string): void {
  if (isDevelopment) {
    const warning = `[AwsUi] collection-hooks ${message}`;
    if (!messageCache.has(warning)) {
      messageCache.add(warning);
      console.warn(warning);
    }
  }
}
