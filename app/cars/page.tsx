import { db } from '@/lib/db';
import { CarsTable } from '@/components/cars-table';

export default async function CarsPage() {
  const cars = await db.car.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      colors: {
        select: { name: true },
      },
    },
  });

  const tableData = cars.map((car) => ({
    id: car.id,
    manufacturer: car.manufacturer,
    model: car.model,
    seats: car.seats,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    bodyType: car.bodyType,
    fuel: car.fuel,
    transmission: car.transmission,
    monthlyPrices: car.monthlyPrices,
    colors: car.colors.map((color) => color.name),
  }));

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold tracking-tight'>Flotta áttekintés</h1>
        <p className='text-muted-foreground'>
          A lenti táblázat az autók fotóit, márkáját, típusát, elérhető színeit, havi áraikat és kapacitását foglalja össze.
        </p>
      </div>

      {cars.length === 0 ? (
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs feltöltött autó. Adj hozzá egyet az „Új autó” oldalon.
        </div>
      ) : (
        <CarsTable data={tableData} />
      )}
    </div>
  );
}
