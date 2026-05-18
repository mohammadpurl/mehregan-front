export type Department = {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  headUserId: number | null;
  headUserName: string | null;
  childrenCount: number;
  usersCount: number;
};

export type DepartmentTreeNode = Department & {
  children: DepartmentTreeNode[];
};

export type DepartmentCreatePayload = {
  name: string;
  parentId?: number | null;
  headUserId?: number | null;
};

export type DepartmentUpdatePayload = {
  name?: string;
  parentId?: number | null;
  headUserId?: number | null;
};

export type DepartmentListResponse = {
  items: Department[];
  total: number;
  page: number;
  pageSize: number;
};
