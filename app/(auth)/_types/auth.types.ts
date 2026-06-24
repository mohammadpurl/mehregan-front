import { InferOutput } from 'valibot';
import { SignInSchema } from './auth.schema';
import type { UserPlan } from '@/app/_types/plan.types';



export type SignInModel = InferOutput<typeof SignInSchema>;
// export type MobileRequestModel = InferOutput<typeof MobileRequestSchema>;
// export type VerifyCodeModel = InferOutput<typeof VerifyCodeSchema>;

export interface UserResponse  {
    accessToken: string;
    sessionId: string;
    sessionExpiry: number;
    userId?: number;
    roles?: string[];
    permissions?: string[];
}
export interface JWT {
    userName: string;
    fullName: string;
    pic: string;
    exp: number;
    roles?: string[];
    permissions?: string[];
    /** When the auth service includes a stable user id in the access token */
    userId?: string;
    sub?: string;
    id?: string | number;
}

export interface UserSession extends JWT {
    accesstoken: string;
    sessionId: string;    
    sessionExpiry: number;
    roles?: string[];
    permissions?: string[];
    /** Resolved at login from JWT (userId / sub / id) when present */
    userId?: string;
    /** Optional subscription/plan metadata when provided by auth service */
    plan?: UserPlan;
}

export interface RegisterModel {
    name: string;
    email: string;
    password: string;
}

export interface SendVerificationCodeResponse {
    success: boolean;
    message?: string;
}
