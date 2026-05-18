export type PlanType = 'free' | 'pro' | 'enterprise';

export interface UserPlan {
  type: PlanType;
  questionLimit: number;
  questionsUsed: number;
  resetDate: string | Date;
}

export function getPlanConfig(type: PlanType): { questionLimit: number } {
  switch (type) {
    case 'pro':
      return { questionLimit: 200 };
    case 'enterprise':
      return { questionLimit: 1000 };
    case 'free':
    default:
      return { questionLimit: 20 };
  }
}

export function createDefaultPlan(): UserPlan {
  const type: PlanType = 'free';
  const { questionLimit } = getPlanConfig(type);
  const resetDate = new Date();
  resetDate.setHours(24, 0, 0, 0);

  return {
    type,
    questionLimit,
    questionsUsed: 0,
    resetDate: resetDate.toISOString(),
  };
}

export function canAskQuestion(plan: UserPlan): { canAsk: boolean; reason?: string } {
  if (plan.questionsUsed >= plan.questionLimit) {
    return {
      canAsk: false,
      reason: 'محدودیت تعداد سوالات پلن شما به پایان رسیده است',
    };
  }

  return { canAsk: true };
}

