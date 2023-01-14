import { StorageKeys } from ':constants/games';
import { parseJSONAttempt, stringifyJSON } from './json-utils';

const makeGameHubKey = (key: string) => {
  return `${StorageKeys.GameHubPrefix}${key}`;
};

export const getLocalStorageItem = <ExpectedModel>(
  key: string
): ExpectedModel | null => {
  const value = window.localStorage.getItem(makeGameHubKey(key));
  return parseJSONAttempt<ExpectedModel>(value);
};

export const setLocalStorageItem = (key: string, value: any) => {
  const valueToSet = stringifyJSON(value);
  window.localStorage.setItem(makeGameHubKey(key), valueToSet);
};
