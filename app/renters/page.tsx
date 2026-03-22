import { RentersTable } from '@/components/renter/renters-table';
import { db } from '@/lib/db';

type RenterPageRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  companyName: string | null;
  paymentMethod: string | null;
  updatedAt: Date;
};

export default async function RentersPage() {
  const renters = await db.$queryRaw<RenterPageRow[]>`
    SELECT
      r."id",
      r."name",
      r."email",
      r."phone",
      r."taxId",
      r."companyName",
      r."paymentMethod",
      r."updatedAt"
    FROM "Renters" r
    ORDER BY r."updatedAt" DESC, r."name" ASC
  `;

  const tableData = renters.map((renter) => ({
    ...renter,
    updatedAt: renter.updatedAt.toISOString(),
  }));

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Bérlők</h1>
      </div>

      <RentersTable data={tableData} />
    </div>
  );
}
