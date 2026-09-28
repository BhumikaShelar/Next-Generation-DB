import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const { username, password, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Prevent registering with the predefined admin username
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    if (cleanUsername === adminUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const assignedRole = 'user';

    const newUser = new User({
      username: cleanUsername,
      password: hash,
      salt,
      role: assignedRole,
    });

    await newUser.save();

    return NextResponse.json(
      { message: 'User registered successfully', username: newUser.username, role: newUser.role },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
