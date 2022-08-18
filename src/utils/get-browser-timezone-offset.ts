// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function getBrowserTimezoneOffset(): number {
  return 0 - new Date().getTimezoneOffset();
}
