export const USER_FORM_QUERY_ROOT = ['user-form'] as const;

export const userFormQueryKeys = {
  rolesInfinite: () => [...USER_FORM_QUERY_ROOT, 'roles-infinite'] as const,
  departmentsInfinite: () => [...USER_FORM_QUERY_ROOT, 'departments-infinite'] as const,
  managersInfinite: (excludeUserId?: number | null) =>
    [...USER_FORM_QUERY_ROOT, 'managers-infinite', excludeUserId ?? null] as const,
};
