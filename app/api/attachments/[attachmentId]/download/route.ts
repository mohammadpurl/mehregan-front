import { API_URL } from '@/configs/global';
import { getSession } from '@/app/utils/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** پروکسی دانلود پیوست — احراز هویت سمت سرور، بدون CORS */
export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const session = await getSession();
  if (!session?.accesstoken) {
    return NextResponse.json({ error: 'لطفاً دوباره وارد شوید' }, { status: 401 });
  }

  const { attachmentId } = await context.params;
  if (!/^\d+$/.test(attachmentId)) {
    return NextResponse.json({ error: 'شناسه پیوست نامعتبر است' }, { status: 400 });
  }

  const apiBase = API_URL.replace(/\/$/, '');
  const backendUrl = `${apiBase}/attachments/${attachmentId}/download`;

  const backendRes = await fetch(backendUrl, {
    headers: { Authorization: `Bearer ${session.accesstoken}` },
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: 'دریافت فایل پیوست ناموفق بود' },
      { status: backendRes.status },
    );
  }

  const body = await backendRes.arrayBuffer();
  const headers = new Headers();
  const contentType = backendRes.headers.get('content-type');
  const disposition = backendRes.headers.get('content-disposition');
  if (contentType) headers.set('Content-Type', contentType);
  if (disposition) headers.set('Content-Disposition', disposition);

  return new NextResponse(body, { status: 200, headers });
}
