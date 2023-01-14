import { GameSocketPayload } from ':types/game-types';
import { getTimeStamp } from './time-utils';
import { isNonEmptyArray } from './validators';

export const makeSocketPayload = (
  data: any,
  metadata: Record<string, any> = {}
): GameSocketPayload => {
  return {
    sentTs: getTimeStamp(),
    data,
    ...metadata,
  };
};

export const combineSocketHandlers = (
  ...handlers: ((...args: any[]) => void)[]
): ((...args: any[]) => void) => {
  if (!isNonEmptyArray) {
    return function unknownSocketHandler(payload: any) {
      console.log(
        `Warning, unhandled socket event, payload: ${JSON.stringify(
          payload,
          undefined,
          4
        )}`
      );
    };
  }
  if (handlers.length === 1) {
    return handlers[0];
  }
  return function combinedSocketHandlers(payload: any) {
    handlers.forEach((handler) => handler?.(payload));
  };
};
