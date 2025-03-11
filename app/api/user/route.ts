import { getUserByEmail } from '@/data-service/user';
import { db } from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
   const { password, email } = await req.json();

   if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
   }

   const hashedPassword = await bcryptjs.hash(password, 10);

   const existingUser = await getUserByEmail(email);

   if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 400 });
   }

   await db.user.create({
      data: {
         email: email,
         password: hashedPassword,
      },
   });

   return NextResponse.json({ message: 'User successfully created' }, { status: 201 });
}
