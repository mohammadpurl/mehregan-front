import type {
  AssigneeStrategy,
  WorkflowDefinition,
  WorkflowStepConfig,
} from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';

const STRATEGIES: AssigneeStrategy[] = ['role_pool', 'fixed_user', 'submitter_manager', 'department_head'];

function coerceStrategy(v: unknown): AssigneeStrategy {
  const s = String(v ?? 'role_pool').toLowerCase();
  return STRATEGIES.includes(s as AssigneeStrategy) ? (s as AssigneeStrategy) : 'role_pool';
}

function normalizeStep(raw: unknown, index: number): WorkflowStepConfig | null {
  if (Array.isArray(raw)) {
    const aliases = raw.map(String).map((a) => a.trim()).filter(Boolean);
    if (!aliases.length) return null;
    return {
      order: index + 1,
      role_aliases: aliases,
      assignee_strategy: 'role_pool',
      assignee_user_id: null,
      label: null,
    };
  }

  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const aliasesRaw = o.role_aliases ?? o.roleAliases ?? o.roles ?? [];
  const aliases = (Array.isArray(aliasesRaw) ? aliasesRaw : [aliasesRaw])
    .map(String)
    .map((a) => a.trim())
    .filter(Boolean);
  if (!aliases.length) return null;

  const uid = o.assignee_user_id ?? o.assigneeUserId;
  return {
    order: Number(o.order) || index + 1,
    role_aliases: aliases,
    assignee_strategy: coerceStrategy(o.assignee_strategy ?? o.assigneeStrategy),
    assignee_user_id: uid != null && uid !== '' ? Number(uid) : null,
    label: o.label != null ? String(o.label) : null,
  };
}

export function normalizeStepsFromApi(raw: unknown): WorkflowStepConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step, i) => normalizeStep(step, i))
    .filter((s): s is WorkflowStepConfig => s != null)
    .map((s, i) => ({ ...s, order: i + 1 }));
}

export function normalizeWorkflowDefinitionFromApi(raw: unknown): WorkflowDefinition | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const refType = String(r.ref_type ?? r.refType ?? r.code ?? '').trim() as WorkflowBusinessRefType;
  if (!refType) return null;

  const stepsRaw = r.steps_config ?? r.stepsConfig ?? r.steps;
  const steps = normalizeStepsFromApi(stepsRaw);

  return {
    id: r.id != null ? Number(r.id) : undefined,
    ref_type: refType,
    name: String(r.name ?? '').trim(),
    code: String(r.code ?? refType).trim(),
    steps,
  };
}

export function stepsToUpsertPayload(steps: WorkflowStepConfig[]) {
  return steps.map((s, i) => ({
    order: i + 1,
    role_aliases: s.role_aliases,
    assignee_strategy: s.assignee_strategy,
    assignee_user_id: s.assignee_strategy === 'fixed_user' ? s.assignee_user_id ?? undefined : undefined,
    label: s.label?.trim() || undefined,
  }));
}

export function createEmptyStep(order: number): WorkflowStepConfig {
  return {
    order,
    role_aliases: [],
    assignee_strategy: 'role_pool',
    assignee_user_id: null,
    label: null,
  };
}
