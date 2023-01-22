import { v4 as uuidV4 } from 'uuid';
import { StorageKeys } from ':constants/games';
import { getLocalStorageItem, setLocalStorageItem } from './window-storage';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { Player } from ':types/game-types';
import { isClient } from './window-utils';

const makePlayerId = () => {
  return `${uuidV4()}-${uuidV4()}`;
};

const makePlayerUsername = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
  });

export const getCachedPlayerId = (): string => {
  const existingPlayerId = getLocalStorageItem<string>(StorageKeys.PlayerIdKey);
  if (existingPlayerId) {
    return existingPlayerId;
  }
  const generatedPlayerId = makePlayerId();
  setLocalStorageItem(StorageKeys.PlayerIdKey, generatedPlayerId);
  return generatedPlayerId;
};

export const getCachedUsername = (): string => {
  const existingUsername = getLocalStorageItem<string>(
    StorageKeys.PlayerUsername
  );
  if (existingUsername) {
    return existingUsername;
  }
  const generatedUsername = makePlayerUsername();
  setLocalStorageItem(StorageKeys.PlayerUsername, generatedUsername);
  return generatedUsername;
};

export const getCachedPlayer = (): Player | null => {
  if (!isClient()) return null;
  return {
    id: getCachedPlayerId(),
    username: getCachedUsername(),
  };
};
