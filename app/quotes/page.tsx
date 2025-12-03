import { getQuotes } from '@/data-service/quotes';
import QuotesTable from './quotes-table';

export default async function QuotesPage() {
  const quotes = await getQuotes();

  if (quotes.length === 0) {
    return (
      <div className='flex h-full flex-col gap-4 p-6'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Ajánlatkérések
          </h1>
          <p className='text-muted-foreground'>
            Itt jelennek meg az érkező megkeresések.
          </p>
        </div>
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs beérkezett ajánlatkérés.
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Ajánlatkérések
        </h1>
      </div>

      <QuotesTable data={quotes} />
    </div>
  );
}
