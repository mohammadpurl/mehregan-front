import { InferOutput } from 'valibot';
import { SignInSchema, MobileRequestSchema, VerifyCodeSchema } from './auth.schema';
import type { UserPlan } from '@/app/_types/plan.types';



export type SignInModel = InferOutput<typeof SignInSchema>;
export type MobileRequestModel = InferOutput<typeof MobileRequestSchema>;
export type VerifyCodeModel = InferOutput<typeof VerifyCodeSchema>;

export interface UserResponse  {
    accessToken: string;
    sessionId: string;
    sessionExpiry: number;
}

export interface JWT {
    userName: string;
    fullName: string;
    pic: string;
    exp: number;
}

export interface UserSession extends JWT {
    accesstoken: string;
    sessionId: string;    
    sessionExpiry: number;
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