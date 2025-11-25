import { NewCarForm } from '@/components/new-car-form';

export default function NewCarPage() {
  return (
    <div className='flex w-full h-full flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Új autó hozzáadása
        </h1>
        <p className='text-muted-foreground'>
          Csak a fotókat, a márkát, a típust, a férőhelyet, a kis/nagy bőröndök számát,
          a kivitelt, az üzemanyagot, a váltót, az elérhető színeket és a havi árakat kell megadnod.
        </p>
      </div>
      <NewCarForm />
    </div>
  );
}
