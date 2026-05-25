import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { AUTH_COOKIE_NAME, getAuthConfig, isProductionAuthConfigured, signSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const auth = getAuthConfig();

    if (process.env.NODE_ENV === 'production' && !isProductionAuthConfigured()) {
      return NextResponse.json(
        { error: 'Admin auth environment variables are not configured.' },
        { status: 500 }
      );
    }

    await dbConnect();

    let user = await User.findOne({ email: email?.toLowerCase() });

    if (email?.toLowerCase() === auth.email.toLowerCase() && password === auth.password) {
      if (!user) {
        const passwordData = hashPassword(auth.password);
        user = await User.create({
          email: auth.email,
          name: 'Owner',
          role: 'owner',
          passwordHash: passwordData.hash,
          passwordSalt: passwordData.salt,
          isActive: true,
        });
      } else {
        let modified = false;
        if (!user.isActive) {
          user.isActive = true;
          modified = true;
        }
        if (user.role !== 'owner' && user.role !== 'admin') {
          user.role = 'owner';
          modified = true;
        }
        if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
          const passwordData = hashPassword(auth.password);
          user.passwordHash = passwordData.hash;
          user.passwordSalt = passwordData.salt;
          modified = true;
        }
        if (modified) {
          await user.save();
        }
      }
    }

    if (!user || !user.isActive || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionToken = await signSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
