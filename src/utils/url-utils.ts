import { isClient } from './window-utils';

export type ParsedParamValue = null | string | string[];

export type ParsedSearchParams = Record<string, ParsedParamValue>;

export const getValueFromUrlSearchParams = (
  key: string,
  searchParams: URLSearchParams
): ParsedParamValue => {
  // if this runs on the server, return null
  if (!isClient()) return null;

  const params: string[] = searchParams.getAll(key);

  // if only one, or no entries were found for param
  if (params.length < 2) {
    // return first entry or null if not found
    return params[0] || null;
  }

  return params;
};

export const getParsedSearchParams = (): ParsedSearchParams => {
  const parsedParams: ParsedSearchParams = {};
  // if this runs on the server, return null
  if (!isClient()) return parsedParams;

  const searchParams = new URLSearchParams(window.location.search);

  const paramsKeys: string[] = [...searchParams.keys()];

  paramsKeys.forEach((key) => {
    parsedParams[key] = getValueFromUrlSearchParams(key, searchParams);
  });

  return parsedParams;
};
