import InsuranceForm from '@/components/insurance/InsuranceForm';
import { db } from '@/lib/db';

export default async function page() {
  const insurance = await db.insurance.findFirst();

  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Biztosítási díjak kezelése
        </h1>
      </div>
      <InsuranceForm insurance={insurance} />
    </div>
  );
}
