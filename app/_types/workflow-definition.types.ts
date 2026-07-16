import type { WorkflowBusinessRefType } from './workflow-runtime.types';

export type AssigneeStrategy =
  | 'role_pool'
  | 'fixed_user'
  | 'submitter_manager'
  | 'department_head';

export interface WorkflowStepConfig {
  order: number;
  role_aliases: string[];
  assignee_strategy: AssigneeStrategy;
  assignee_user_id?: number | null;
  label?: string | null;
  step_action?: string | null;
}

export interface WorkflowDefinition {
  id?: number;
  ref_type: WorkflowBusinessRefType;
  name: string;
  code: string;
  steps: WorkflowStepConfig[];
}

export interface WorkflowDefinitionListResponse {
  items: WorkflowDefinition[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkflowDefinitionUpsert {
  ref_type: WorkflowBusinessRefType;
  name: string;
  code: string;
  steps: WorkflowStepConfig[];
}

export interface WorkflowAssigneePreview {
  order: number;
  roleAliases: string[];
  roleId?: number | null;
  assigneeStrategy: AssigneeStrategy;
  assigneeUserId?: number | null;
  resolvedUserId?: number | null;
  resolvedUserName?: string | null;
  label?: string | null;
}
