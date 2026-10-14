// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const tokenGroupSimple = {
  tokens: [],
  operation: 'and',
  tokenGroups: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
  ],
};

export const tokenGroupWithArrays = {
  tokens: [],
  operation: 'and',
  tokenGroups: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
    {
      propertyKey: 'state',
      operator: '=',
      value: ['STOPPED', 'STOPPING', 'PENDING'],
    },
    {
      propertyKey: 'stopped',
      operator: '=',
      value: true,
    },
    {
      propertyKey: 'instancetype',
      operator: '=',
      value: 't2.medium',
    },
  ],
};

export const tokenGroupWithArraysAndDates = {
  tokens: [],
  operation: 'and',
  tokenGroups: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
    {
      propertyKey: 'state',
      operator: '=',
      value: ['STOPPED', 'STOPPING', 'PENDING'],
    },
    {
      propertyKey: 'stopped',
      operator: '=',
      value: true,
    },
    {
      propertyKey: 'instancetype',
      operator: '=',
      value: 't2.medium',
    },
    {
      propertyKey: 'averagelatency',
      operator: '<=',
      value: '123',
    },
    {
      propertyKey: 'availablestorage',
      operator: '=',
      value: '6.86',
    },
    {
      propertyKey: 'owner',
      operator: '=',
      value: ['admin512', 'admin0', 'admin6621'],
    },
    {
      propertyKey: 'privateipaddress',
      operator: ':',
      value: '116.198.231.86',
    },
    {
      propertyKey: 'publicdns',
      operator: '=',
      value: 'ec2-23-50-59-84.us-west-1.compute.amazonaws.com',
    },
    {
      propertyKey: 'publicdns',
      operator: ':',
      value: 'ec2-11-56-64-85.eu-west-2.compute.amazonaws.com',
    },
    {
      propertyKey: 'ipv4publicip',
      operator: ':',
      value: '90.77.83.18',
    },
    {
      propertyKey: 'securitygroup',
      operator: '!=',
      value: 'launch-wizard-66',
    },
    {
      propertyKey: 'releasedate',
      operator: '>=',
      value: '2024-12-21',
    },
  ],
};

export const tokensSimple = {
  tokens: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
  ],
  operation: 'and',
};

export const tokensWithArrays = {
  tokens: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
    {
      propertyKey: 'state',
      operator: '!=',
      value: ['STOPPING', 'PENDING'],
    },
    {
      propertyKey: 'stopped',
      operator: '=',
      value: false,
    },
    {
      propertyKey: 'instancetype',
      operator: ':',
      value: 't3.nano',
    },
  ],
  operation: 'and',
};

export const tokensWithArraysAndDates = {
  tokens: [
    {
      propertyKey: 'instanceid',
      operator: '=',
      value: 'i-2dc5ce28a0328391',
    },
    {
      propertyKey: 'state',
      operator: '!=',
      value: ['STOPPING', 'PENDING'],
    },
    {
      propertyKey: 'stopped',
      operator: '=',
      value: false,
    },
    {
      propertyKey: 'instancetype',
      operator: ':',
      value: 't3.nano',
    },
    {
      propertyKey: 'releasedate',
      operator: '<=',
      value: '2024-12-20',
    },
    {
      propertyKey: 'launchdate',
      operator: '>',
      value: '2024-12-01',
    },
    {
      propertyKey: 'tags',
      operator: '!:',
      value: ['AAA', 'AB'],
    },
  ],
  operation: 'and',
};
