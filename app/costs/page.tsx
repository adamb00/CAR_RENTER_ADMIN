import { HandoverCostsManager } from '@/components/costs/handover-costs-manager';
import { db } from '@/lib/db';
import {
  DEFAULT_HANDOVER_COST_TYPES,
  getDefaultHandoverCostTypeCategory,
  getDefaultHandoverCostTypeLabel,
  HandoverCostTypeCategory,
} from '@/lib/handover-cost-types';

type HandoverCostPageRow = {
  id: string;
  bookingId: string;
  bookingHumanId: string | null;
  contactName: string;
  direction: 'out' | 'in' | null;
  costType: string;
  customCostTypeSlug: string | null;
  customCostTypeLabel: string | null;
  customCostTypeCategory: HandoverCostTypeCategory | null;
  amount: { toString(): string } | string | number;
  createdAt: Date;
};

type BookingOptionRow = {
  id: string;
  humanId: string | null;
  contactName: string;
  createdAt: Date;
};

type CostTypeOptionRow = {
  slug: string;
  label: string;
  category: HandoverCostTypeCategory;
  usageCount: number;
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
  const [costRows, bookingRows, costTypeRows] = await Promise.all([
    db.$queryRaw<HandoverCostPageRow[]>`
      SELECT
        c."id",
        c."bookingId",
        rr."humanId" AS "bookingHumanId",
        rr."contactname" AS "contactName",
        c."direction",
        c."costType"::text AS "costType",
        c."customCostTypeSlug",
        t."label" AS "customCostTypeLabel",
        t."category" AS "customCostTypeCategory",
        c."amount",
        c."createdAt"
      FROM "BookingHandoverCosts" c
      LEFT JOIN "HandoverCustomCostTypes" t ON t."slug" = c."customCostTypeSlug"
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
    db.$queryRaw<CostTypeOptionRow[]>`
      SELECT
        t."slug",
        t."label",
        t."category",
        COALESCE(stats."usageCount", 0)::int AS "usageCount"
      FROM "HandoverCustomCostTypes" t
      LEFT JOIN (
        SELECT "customCostTypeSlug", COUNT(*)::int AS "usageCount"
        FROM "BookingHandoverCosts"
        WHERE "customCostTypeSlug" IS NOT NULL
        GROUP BY "customCostTypeSlug"
      ) stats ON stats."customCostTypeSlug" = t."slug"
      ORDER BY t."sortOrder" ASC, t."label" ASC
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
    costType:
      row.costType === 'custom' ? (row.customCostTypeSlug ?? 'custom') : row.costType,
    costTypeLabel:
      row.costType === 'custom'
        ? (row.customCostTypeLabel ?? row.customCostTypeSlug ?? 'Egyedi típus')
        : getDefaultHandoverCostTypeLabel(row.costType),
    costTypeCategory:
      row.costType === 'custom'
        ? (row.customCostTypeCategory ?? 'expense')
        : getDefaultHandoverCostTypeCategory(row.costType),
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

  const defaultUsageCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.costType] = (acc[row.costType] ?? 0) + 1;
    return acc;
  }, {});

  const costTypeOptions = [
    ...DEFAULT_HANDOVER_COST_TYPES.map((row) => ({
      slug: row.slug,
      label: row.label,
      category: row.category,
      isDefault: true,
      usageCount: defaultUsageCounts[row.slug] ?? 0,
    })),
    ...costTypeRows.map((row) => ({
      slug: row.slug,
      label: row.label,
      category: row.category,
      isDefault: false,
      usageCount: row.usageCount,
    })),
  ];

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Költségek</h1>
      </div>

      <HandoverCostsManager
        rows={rows}
        bookingOptions={bookingOptions}
        costTypeOptions={costTypeOptions}
      />
    </div>
  );
}
