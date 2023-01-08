import { isNonEmptyArray, isNonEmptyString } from ':utils/validators';
import { useIsoRouterQuery } from './use-iso-router-query';

export const useQueryRoomId = (): string => {
  const query = useIsoRouterQuery();

  if (isNonEmptyArray(query.roomId)) {
    return query.roomId![0];
  }

  if (!isNonEmptyString(query.roomId)) return '';

  return query.roomId as string;
};
