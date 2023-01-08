import { GameSocketPayload } from ':types/game-types';
import { getTimeStamp } from './time-utils';

export const makeSocketPayload = (data: any): GameSocketPayload => {
  return {
    sentTs: getTimeStamp(),
    data,
  };
};
