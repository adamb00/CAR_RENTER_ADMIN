import NewAccommodationForm from '@/components/accommodation/new-accommodation-form';

export default function page() {
  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Szállás felvétele a rendszerbe
        </h1>
      </div>
      <NewAccommodationForm />
    </div>
  );
}
