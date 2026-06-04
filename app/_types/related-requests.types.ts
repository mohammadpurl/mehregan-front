export type RelatedRequestItem = {
  refType: string;
  refId: number;
  label: string;
  title: string;
  status?: string | null;
  relation?: string;
  workflowInstanceId?: number | null;
  workflowStatus?: string | null;
  createdAt?: string | null;
  isAnchor?: boolean;
  linkRefType?: string;
  linkRefId?: number;
};

export type RelatedRequestsResponse = {
  anchor: {
    refType: string;
    refId: number;
    label: string;
  };
  items: RelatedRequestItem[];
};
