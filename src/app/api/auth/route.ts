import { NextRequest, NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD;

export async function POST(request: NextRequest) {
  if (!SITE_PASSWORD) {
    console.error('SITE_PASSWORD env var is not set');
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  try {
    const { password } = await request.json();

    if (password === SITE_PASSWORD) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set('rfp-auth', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
