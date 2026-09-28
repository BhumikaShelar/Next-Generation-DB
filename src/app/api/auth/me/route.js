import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const decoded = verifyToken(sessionCookie);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
