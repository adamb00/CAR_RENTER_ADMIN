import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'cars';

const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, '');

const extractPathFromUrl = (url: string) => {
  if (!SUPABASE_URL) return stripLeadingSlashes(url);
  const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
  const rawPrefix = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/`;

  if (url.startsWith(publicPrefix)) {
    return stripLeadingSlashes(url.slice(publicPrefix.length));
  }
  if (url.startsWith(rawPrefix)) {
    return stripLeadingSlashes(url.slice(rawPrefix.length));
  }

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
    if (parsed.pathname.includes(marker)) {
      return stripLeadingSlashes(parsed.pathname.split(marker)[1] ?? '');
    }
  } catch {
    return stripLeadingSlashes(url);
  }

  return stripLeadingSlashes(url);
};

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    return NextResponse.json(
      { error: 'Hiányzó Supabase környezeti változók.' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const urls = Array.isArray(body?.urls) ? (body.urls as string[]) : [];
  const paths = Array.isArray(body?.paths) ? (body.paths as string[]) : [];

  const resolvedPaths = [
    ...paths,
    ...urls.map((url) => extractPathFromUrl(url)),
  ].filter((path) => path && path.length > 0);

  if (resolvedPaths.length === 0) {
    return NextResponse.json(
      { error: 'Hiányzó törlendő fájlok.' },
      { status: 400 },
    );
  }

  try {
    for (const path of resolvedPaths) {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Ismeretlen hiba a törlés közben.');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase törlési hiba:', error);
    return NextResponse.json(
      { error: 'Nem sikerült törölni a fájlokat.' },
      { status: 500 },
    );
  }
}
