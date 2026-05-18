import { deleteProfileAvatarRemote, extractProfileErrorMessage, uploadProfileAvatarFile } from '@/app/lib/profile-server';
import { getSession } from '@/app/utils/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accesstoken) {
    return NextResponse.json({ success: false, error: 'لطفاً دوباره وارد شوید' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'فایل تصویر یافت نشد' }, { status: 400 });
    }

    const data = await uploadProfileAvatarFile(file);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = extractProfileErrorMessage(err);
    const status = message.includes('حجم تصویر') || message.includes('فرمت مجاز') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.accesstoken) {
    return NextResponse.json({ success: false, error: 'لطفاً دوباره وارد شوید' }, { status: 401 });
  }

  try {
    const data = await deleteProfileAvatarRemote();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: extractProfileErrorMessage(err) || 'خطا در حذف تصویر' },
      { status: 500 },
    );
  }
}
