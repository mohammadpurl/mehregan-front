export interface UserResponse {
    accessToken: string;
    sessionId: string;
    sessionExpiry: number;
}


export interface JWT {
    username: string;
    fullName: string;
    pic: string;
    exp: number;
    roles?: string[];
    permissions?: string[];
}

export interface UserSession extends JWT {
    accessToken: string;
    sessionId: string;
    sessionExpiry: number;
    roles?: string[];
    permissions?: string[];
}