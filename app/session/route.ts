import { decryptSession, toClientSession } from "@/app/utils/session";
import { ERP_SESSION_COOKIE } from "@/app/utils/auth-cookie";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get(ERP_SESSION_COOKIE)?.value;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const decryptedSession = await decryptSession(session);
            if (!decryptedSession) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const clientSession = toClientSession(decryptedSession);
            return NextResponse.json(clientSession, { status: 200 });
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST() {
    const cookieStore = await cookies();
    const session = cookieStore.get(ERP_SESSION_COOKIE)?.value;
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
}
