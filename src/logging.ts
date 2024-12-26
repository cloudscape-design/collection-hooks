// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
