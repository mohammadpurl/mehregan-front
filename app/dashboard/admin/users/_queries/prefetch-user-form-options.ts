import type { QueryClient } from '@tanstack/react-query';
import { USER_FORM_QUERY_ROOT, userFormQueryKeys } from './keys';
import { fetchDepartmentsPage, fetchRolesPage } from './fetchers';

/** پیش‌بارگذاری صفحهٔ اول — بدون cache ماندگار */
export function prefetchUserFormOptions(queryClient: QueryClient) {
  void queryClient.prefetchInfiniteQuery({
    queryKey: [...userFormQueryKeys.rolesInfinite(), ''],
    queryFn: ({ pageParam }) => fetchRolesPage(pageParam as number, ''),
    initialPageParam: 1,
    staleTime: 0,
  });
  void queryClient.prefetchInfiniteQuery({
    queryKey: [...userFormQueryKeys.departmentsInfinite(), ''],
    queryFn: ({ pageParam }) => fetchDepartmentsPage(pageParam as number, ''),
    initialPageParam: 1,
    staleTime: 0,
  });
}

export function invalidateUserFormQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: USER_FORM_QUERY_ROOT });
}
