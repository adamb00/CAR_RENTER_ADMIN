import { db } from '@/lib/db';

const HUMAN_ID_PAD = 4;

export type HumanIdTable = 'ContactQuotes' | 'RentRequests';

export async function getNextHumanId(
  table: HumanIdTable,
): Promise<string | null> {
  const year = new Date().getFullYear();
  const prefix = `${year}/`;

  try {
    const last =
      table === 'ContactQuotes'
        ? await db.contactQuotes.findFirst({
            where: { humanId: { startsWith: prefix } },
            orderBy: { humanId: 'desc' },
            select: { humanId: true },
          })
        : await db.rentRequests.findFirst({
            where: { humanId: { startsWith: prefix } },
            orderBy: { humanId: 'desc' },
            select: { humanId: true },
          });

    const lastHumanId = last?.humanId;
    const lastNumber = lastHumanId?.includes('/')
      ? Number.parseInt(lastHumanId.split('/')[1] ?? '', 10)
      : Number.NaN;
    const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

    return `${prefix}${String(nextNumber).padStart(HUMAN_ID_PAD, '0')}`;
  } catch (error) {
    console.error(`Failed to fetch last humanId for ${table}`, error);
    return null;
  }
}

