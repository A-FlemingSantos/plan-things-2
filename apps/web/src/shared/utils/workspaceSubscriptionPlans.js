const GIB = 1024 ** 3;

export const WORKSPACE_SUBSCRIPTION_PLANS = [
  {
    id: 'BASIC',
    label: 'Básico',
    quotaBytes: 2 * GIB,
  },
  {
    id: 'PROFESSIONAL',
    label: 'Profissional',
    quotaBytes: 50 * GIB,
  },
  {
    id: 'TEAM',
    label: 'Equipe',
    quotaBytes: 500 * GIB,
  },
];

export function getWorkspacePlanLabel(planId) {
  return WORKSPACE_SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)?.label ?? 'Básico';
}

export function getWorkspacePlanQuotaBytes(planId) {
  return WORKSPACE_SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)?.quotaBytes ?? WORKSPACE_SUBSCRIPTION_PLANS[0].quotaBytes;
}
