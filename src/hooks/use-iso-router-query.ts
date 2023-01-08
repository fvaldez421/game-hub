import { useRouter } from 'next/router';
import { getParsedSearchParams } from ':utils/url-utils';

export const useIsoRouterQuery = () => {
  const router = useRouter();
  const urlQuery = getParsedSearchParams();

  return { ...router.query, ...urlQuery };
};
