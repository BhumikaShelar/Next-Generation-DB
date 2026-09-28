import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (cleanUsername === adminUsername) {
      if (password !== adminPassword) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }

      // Create session payload for predefined admin
      const token = createToken({
        userId: '000000000000000000000ade', // Hex-compatible dummy ID for admin
        username: adminUsername,
        role: 'admin',
      });

      // Set HTTP-Only session cookie
      cookies().set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 1 day
      });

      return NextResponse.json({
        message: 'Logged in successfully',
        user: {
          id: '000000000000000000000ade',
          username: adminUsername,
          role: 'admin',
        }
      }, { status: 200 });
    }

    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password, user.salt);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create session payload
    const token = createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    // Set HTTP-Only session cookie
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 1 day
    });

    return NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
