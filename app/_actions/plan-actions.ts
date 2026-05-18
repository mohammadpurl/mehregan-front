'use server';

import { getSession } from "@/app/utils/session";
import { UserPlan, createDefaultPlan, canAskQuestion, getPlanConfig } from "@/app/_types/plan.types";

/**
 * دریافت پلن کاربر از session
 */
export async function getUserPlanAction(): Promise<UserPlan> {
    try {
        const session = await getSession();
        if (!session) {
            // اگر کاربر لاگین نباشد، پلن پیش‌فرض برگردان
            return createDefaultPlan();
        }
        
        // اگر پلن در session وجود دارد، برگردان
        if (session.plan) {
            // تبدیل resetDate به Date object برای بررسی
            const resetDate = session.plan.resetDate instanceof Date 
                ? session.plan.resetDate 
                : new Date(session.plan.resetDate);
            
            // بررسی اینکه آیا تاریخ ریست گذشته است یا نه
            const now = new Date();
            
            if (now > resetDate) {
                // تاریخ ریست گذشته، پلن را ریست کن
                const newPlan = createDefaultPlan();
                newPlan.type = session.plan.type; // نوع پلن را حفظ کن
                newPlan.questionLimit = getPlanConfig(session.plan.type).questionLimit;
                return newPlan;
            }
            
            // برگرداندن پلن با resetDate به صورت string (برای سازگاری با JWT)
            return {
                ...session.plan,
                resetDate: typeof session.plan.resetDate === 'string' 
                    ? session.plan.resetDate 
                    : session.plan.resetDate.toISOString(),
            };
        }
        
        // اگر پلن وجود ندارد، پلن پیش‌فرض ایجاد کن
        return createDefaultPlan();
    } catch (error) {
        console.error('[PLAN-ACTION] Error getting user plan:', error);
        return createDefaultPlan();
    }
}

/**
 * بررسی اینکه آیا کاربر می‌تواند سوال بپرسد
 */
export async function checkCanAskQuestionAction(): Promise<{ 
    canAsk: boolean; 
    reason?: string;
    plan?: UserPlan;
}> {
    try {
        const plan = await getUserPlanAction();
        const checkResult = canAskQuestion(plan);
        
        return {
            ...checkResult,
            plan,
        };
    } catch (error) {
        console.error('[PLAN-ACTION] Error checking can ask question:', error);
        return {
            canAsk: false,
            reason: 'خطا در بررسی پلن کاربر',
        };
    }
}

/**
 * افزایش تعداد سوالات استفاده شده
 * این تابع باید بعد از هر سوال موفق فراخوانی شود
 * توجه: این فقط در frontend است، باید در backend هم پیاده‌سازی شود
 */
export async function incrementQuestionCountAction(): Promise<{ success: boolean }> {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false };
        }
        
        // این فقط یک placeholder است
        // در واقعیت، باید به backend API درخواست بزنیم تا تعداد سوالات را افزایش دهد
        // و session را به‌روزرسانی کند
        
        // TODO: فراخوانی API برای افزایش تعداد سوالات
        // await updateUserQuestionCount(session.sessionId);
        
        return { success: true };
    } catch (error) {
        console.error('[PLAN-ACTION] Error incrementing question count:', error);
        return { success: false };
    }
}

