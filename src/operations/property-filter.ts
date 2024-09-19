// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  PropertyFilterOperator,
  PropertyFilterOperatorExtended,
  PropertyFilterQuery,
  PropertyFilterToken,
  UseCollectionOptions,
  PropertyFilterProperty,
  PropertyFilterTokenGroup,
  PropertyFilterPropertyType,
} from '../interfaces';
import { compareDates, compareTimestamps } from '../date-utils/compare-dates.js';
import { Predicate } from './compose-filters';

const filterUsingOperator = (
  itemValue: any,
  {
    tokenValue,
    operator: { operator, match },
    type,
  }: {
    tokenValue: any;
    operator: PropertyFilterOperatorExtended<any>;
    type?: PropertyFilterPropertyType;
  }
) => {
  if (match === 'date' || match === 'datetime') {
    const comparator = match === 'date' ? compareDates : compareTimestamps;
    const comparisonResult = comparator(itemValue, tokenValue);
    switch (operator) {
      case '<':
        return comparisonResult < 0;
      case '<=':
        return comparisonResult <= 0;
      case '>':
        return comparisonResult > 0;
      case '>=':
        return comparisonResult >= 0;
      case '=':
        return comparisonResult === 0;
      case '!=':
        return comparisonResult !== 0;
      default:
        return false;
    }
  } else if (typeof match === 'function') {
    return match(itemValue, tokenValue);
  } else if (match) {
    throw new Error('Unsupported `operator.match` type given.');
  }

  if (type === 'enum' && Array.isArray(tokenValue)) {
    switch (operator) {
      case '=':
        return tokenValue.includes(itemValue);
      case '!=':
        return !tokenValue.includes(itemValue);
      default:
      // When other operator is given the comparison is done as for type="auto".
    }
  }

  switch (operator) {
    case '<':
      return itemValue < tokenValue;
    case '<=':
      return itemValue <= tokenValue;
    case '>':
      return itemValue > tokenValue;
    case '>=':
      return itemValue >= tokenValue;
    case '=':
      // eslint-disable-next-line eqeqeq
      return itemValue == tokenValue;
    case '!=':
      // eslint-disable-next-line eqeqeq
      return itemValue != tokenValue;
    case ':':
      return (itemValue + '').toLowerCase().indexOf((tokenValue + '').toLowerCase()) > -1;
    case '!:':
      return (itemValue + '').toLowerCase().indexOf((tokenValue + '').toLowerCase()) === -1;
    case '^':
      return (itemValue + '').toLowerCase().startsWith((tokenValue + '').toLowerCase());
    case '!^':
      return !(itemValue + '').toLowerCase().startsWith((tokenValue + '').toLowerCase());
    // The unsupported operators result in an exception being thrown.
    // The exception can be avoided if using the match function.
    default:
      throw new Error('Unsupported operator given.');
  }
};

function freeTextFilter<T>(
  tokenValue: string,
  item: T,
  operator: PropertyFilterOperator,
  filteringPropertiesMap: FilteringPropertiesMap<T>
): boolean {
  // If the operator is not a negation, we just need one property of the object to match.
  // If the operator is a negation, we want none of the properties of the object to match.
  const isNegation = operator.startsWith('!');
  return Object.keys(filteringPropertiesMap)[isNegation ? 'every' : 'some'](propertyKey => {
    const { operators } = filteringPropertiesMap[propertyKey as keyof typeof filteringPropertiesMap];
    const propertyOperator = operators[operator];
    if (!propertyOperator) {
      return isNegation;
    }
    return filterUsingOperator(item[propertyKey as keyof typeof item], { tokenValue, operator: propertyOperator });
  });
}

function filterByToken<T>(token: PropertyFilterToken, item: T, filteringPropertiesMap: FilteringPropertiesMap<T>) {
  if (token.propertyKey) {
    // token refers to a unknown property or uses an unsupported operator
    if (
      !(token.propertyKey in filteringPropertiesMap) ||
      !(token.operator in filteringPropertiesMap[token.propertyKey as keyof FilteringPropertiesMap<T>].operators)
    ) {
      return false;
    }
    const property = filteringPropertiesMap[token.propertyKey as keyof FilteringPropertiesMap<T>];
    const operator = property.operators[token.operator];
    const type = property.type;
    const itemValue: any = operator?.match
      ? item[token.propertyKey as keyof T]
      : fixupFalsyValues(item[token.propertyKey as keyof T]);
    return filterUsingOperator(itemValue, {
      tokenValue: token.value,
      operator: operator ?? { operator: token.operator },
      type,
    });
  }
  return freeTextFilter(token.value, item, token.operator, filteringPropertiesMap);
}

function defaultFilteringFunction<T>(filteringPropertiesMap: FilteringPropertiesMap<T>) {
  return (item: T, query: PropertyFilterQuery) => {
    function evaluate(tokenOrGroup: PropertyFilterToken | PropertyFilterTokenGroup): boolean {
      if ('operation' in tokenOrGroup) {
        let result = tokenOrGroup.operation === 'and' ? true : !tokenOrGroup.tokens.length;
        for (const group of tokenOrGroup.tokens) {
          result = tokenOrGroup.operation === 'and' ? result && evaluate(group) : result || evaluate(group);
        }
        return result;
      } else {
        return filterByToken(tokenOrGroup, item, filteringPropertiesMap);
      }
    }
    return evaluate({
      operation: query.operation,
      tokens: query.tokenGroups ?? query.tokens,
    });
  };
}

type FilteringPropertiesMap<T> = {
  [key in keyof T]: {
    type?: PropertyFilterPropertyType;
    operators: FilteringOperatorsMap;
  };
};

type FilteringOperatorsMap = {
  [key in PropertyFilterOperator]?: PropertyFilterOperatorExtended<any>;
};

export function createPropertyFilterPredicate<T>(
  propertyFiltering: UseCollectionOptions<T>['propertyFiltering'],
  query: PropertyFilterQuery = { tokens: [], operation: 'and' }
): null | Predicate<T> {
  if (!propertyFiltering) {
    return null;
  }
  const filteringPropertiesMap = propertyFiltering.filteringProperties.reduce<FilteringPropertiesMap<T>>(
    (acc: FilteringPropertiesMap<T>, { key, operators, defaultOperator, type }: PropertyFilterProperty) => {
      const operatorMap: FilteringOperatorsMap = { [defaultOperator ?? '=']: { operator: defaultOperator ?? '=' } };
      operators?.forEach(op => {
        if (typeof op === 'string') {
          operatorMap[op] = { operator: op };
        } else {
          operatorMap[op.operator] = { operator: op.operator, match: op.match };
        }
      });
      acc[key as keyof T] = { type, operators: operatorMap };
      return acc;
    },
    {} as FilteringPropertiesMap<T>
  );
  const filteringFunction = propertyFiltering.filteringFunction || defaultFilteringFunction(filteringPropertiesMap);
  return item => filteringFunction(item, query);
}

export const fixupFalsyValues = <T>(value: T): T | string => {
  if (typeof value === 'boolean') {
    return value + '';
  }
  if (value || (value as any as number) === 0) {
    return value;
  }
  return '';
};
