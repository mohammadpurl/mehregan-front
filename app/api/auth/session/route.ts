import { decryptSession } from "@/app/utils/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('erp-session')?.value;

        if (!session) {
            return new Response('Unauthorized', { status: 401 });
        }

        try {
            const decryptedSession = await decryptSession(session);
            if (!decryptedSession) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return new Response(JSON.stringify(decryptedSession), { status: 200 });
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST() {
    const cookieStore = await cookies();
    const session = cookieStore.get('erp-session')?.value;
    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }
}
