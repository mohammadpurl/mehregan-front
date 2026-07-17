import type {
  AssigneeStrategy,
  WorkflowDefinition,
  WorkflowStepConfig,
} from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { roleLabel, type Role } from '@/app/_types/role.types';

const STRATEGIES: AssigneeStrategy[] = ['role_pool', 'fixed_user', 'submitter_manager', 'department_head'];

function coerceStrategy(v: unknown): AssigneeStrategy {
  const s = String(v ?? 'role_pool').toLowerCase();
  return STRATEGIES.includes(s as AssigneeStrategy) ? (s as AssigneeStrategy) : 'role_pool';
}

/**
 * برچسب‌های فارسی/alias تکراری را به role.name پایدار نگاشت می‌کند.
 * بدون این کار، بعد از عوض کردن نقش در UI هنوز alias فارسی نقش قبلی می‌ماند
 * و در بک‌اند دوباره به همان نقش قبلی resolve می‌شود.
 */
export function canonicalizeAliasesAgainstRoles(
  aliases: string[],
  roles: Role[],
): string[] {
  if (!roles.length) return aliases.map(String).map((a) => a.trim()).filter(Boolean);
  const byKey = new Map<string, string>();
  for (const role of roles) {
    const name = role.name?.trim();
    if (!name) continue;
    byKey.set(name.toLowerCase(), name);
    const label = roleLabel(role).trim();
    if (label) byKey.set(label.toLowerCase(), name);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of aliases) {
    const key = String(raw).trim().toLowerCase();
    if (!key) continue;
    const canonical = byKey.get(key);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}

export function scrubStepsRoleAliases(
  steps: WorkflowStepConfig[],
  roles: Role[],
): WorkflowStepConfig[] {
  if (!roles.length) return steps;
  return steps.map((s, i) => ({
    ...s,
    order: i + 1,
    role_aliases: canonicalizeAliasesAgainstRoles(s.role_aliases, roles),
  }));
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
    step_action:
      o.step_action != null || o.stepAction != null
        ? String(o.step_action ?? o.stepAction)
        : null,
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
    step_action: s.step_action?.trim() || undefined,
  }));
}

export function createEmptyStep(order: number): WorkflowStepConfig {
  return {
    order,
    role_aliases: [],
    assignee_strategy: 'role_pool',
    assignee_user_id: null,
    label: null,
    step_action: 'approval',
  };
}
