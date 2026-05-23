import { getAllAccommodations } from '@/data-service/accommodations';

import AccommodationsTable from './accommodations-table';

export default async function page() {
  const accommodations = await getAllAccommodations();

  if (accommodations.length === 0) {
    return (
      <div className='flex h-full flex-col gap-4 p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Szállások</h1>
            <p className='text-muted-foreground'>
              Itt jelennek meg a rendszerbe felvett szállások.
            </p>
          </div>
        </div>
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs felvett szállás.
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Szállások</h1>
          <p className='text-muted-foreground'>
            Itt jelennek meg a rendszerbe felvett szállások.
          </p>
        </div>
      </div>
      <AccommodationsTable data={accommodations} />
    </div>
  );
}
