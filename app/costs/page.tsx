import { HandoverCostsManager } from '@/components/costs/handover-costs-manager';
import { db } from '@/lib/db';

type HandoverCostPageRow = {
  id: string;
  bookingId: string;
  bookingHumanId: string | null;
  contactName: string;
  direction: 'out' | 'in' | null;
  costType: 'tip' | 'fuel' | 'ferry' | 'cleaning' | 'commission';
  amount: { toString(): string } | string | number;
  createdAt: Date;
};

type BookingOptionRow = {
  id: string;
  humanId: string | null;
  contactName: string;
  createdAt: Date;
};

const formatBookingLabel = (
  bookingHumanId: string | null,
  bookingId: string,
  contactName: string,
  createdAt: Date,
) => {
  const bookingCode = bookingHumanId?.trim() || bookingId.slice(0, 8);
  const created = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(createdAt);

  return `${bookingCode} • ${contactName} • ${created}`;
};

export default async function CostsPage() {
  const [costRows, bookingRows] = await Promise.all([
    db.$queryRaw<HandoverCostPageRow[]>`
      SELECT
        c."id",
        c."bookingId",
        rr."humanId" AS "bookingHumanId",
        rr."contactname" AS "contactName",
        c."direction",
        c."costType",
        c."amount",
        c."createdAt"
      FROM "BookingHandoverCosts" c
      INNER JOIN "RentRequests" rr ON rr."id" = c."bookingId"
      ORDER BY c."createdAt" DESC, c."id" DESC
    `,
    db.$queryRaw<BookingOptionRow[]>`
      SELECT
        "id",
        "humanId",
        "contactname" AS "contactName",
        "createdAt"
      FROM "RentRequests"
      ORDER BY "createdAt" DESC, "contactname" ASC
    `,
  ]);

  const rows = costRows.map((row) => ({
    id: row.id,
    bookingId: row.bookingId,
    bookingLabel: formatBookingLabel(
      row.bookingHumanId,
      row.bookingId,
      row.contactName,
      row.createdAt,
    ),
    contactName: row.contactName,
    direction: row.direction,
    costType: row.costType,
    amount: row.amount.toString(),
    createdAt: row.createdAt.toISOString(),
  }));

  const bookingOptions = bookingRows.map((booking) => ({
    id: booking.id,
    label: formatBookingLabel(
      booking.humanId,
      booking.id,
      booking.contactName,
      booking.createdAt,
    ),
  }));

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Költségek</h1>
      </div>

      <HandoverCostsManager rows={rows} bookingOptions={bookingOptions} />
    </div>
  );
}
