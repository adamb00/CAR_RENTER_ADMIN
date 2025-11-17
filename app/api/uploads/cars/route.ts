import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'cars';

const MAX_FILES_PER_REQUEST = 3;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    return NextResponse.json(
      { error: 'Hiányzó Supabase környezeti változók.' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File)
    .slice(0, MAX_FILES_PER_REQUEST);

  const folder = (formData.get('folder') as string | null) || 'uncategorized';

  if (!files.length) {
    return NextResponse.json(
      { error: 'Nem érkezett fájl a kérésben.' },
      { status: 400 }
    );
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `${folder}/${randomUUID()}.${extension}`;

        const response = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${filePath}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': file.type || 'application/octet-stream',
              'x-upsert': 'true',
            },
            body: buffer,
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(errorBody || 'Ismeretlen hiba a feltöltés közben.');
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filePath}`;

        console.log('Fájl feltöltve:', publicUrl);

        return {
          name: file.name,
          path: filePath,
          url: publicUrl,
        };
      })
    );

    return NextResponse.json({ urls: uploads });
  } catch (error) {
    console.error('Supabase feltöltési hiba:', error);
    return NextResponse.json(
      { error: 'Nem sikerült feltölteni a fájlokat. Próbáld újra később.' },
      { status: 500 }
    );
  }
}
