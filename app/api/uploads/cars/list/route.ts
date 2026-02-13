import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'cars';

const DEFAULT_LIST_LIMIT = 100;

const normalizeFolder = (folder: string) =>
  folder.replace(/^\/+/, '').replace(/\/+$/, '');

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    return NextResponse.json(
      { error: 'Hiányzó Supabase környezeti változók.' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder');

  if (!folder) {
    return NextResponse.json(
      { error: 'Hiányzó mappa megadás.' },
      { status: 400 },
    );
  }

  const normalizedFolder = normalizeFolder(folder);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_STORAGE_BUCKET}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix: normalizedFolder,
          limit: DEFAULT_LIST_LIMIT,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || 'Ismeretlen hiba a listázás közben.');
    }

    const items = (await response.json()) as Array<{ name?: string }>;
    const basePublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
    const prefix = normalizedFolder ? `${normalizedFolder}/` : '';

    const urls = items
      .map((item) => item?.name)
      .filter((name): name is string => Boolean(name))
      .map((name) =>
        name.startsWith(prefix) ? `${basePublicUrl}${name}` : `${basePublicUrl}${prefix}${name}`,
      );

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Supabase listázási hiba:', error);
    return NextResponse.json(
      { error: 'Nem sikerült lekérni a fájlokat.' },
      { status: 500 },
    );
  }
}
