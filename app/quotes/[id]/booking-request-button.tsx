'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sendBookingRequestEmailAction } from '@/actions/sendBookingRequestEmailAction';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCarById } from '@/data-service/cars';

const pricingSchema = z.object({
  adminName: z.string().min(1, 'Név kötelező'),
  carId: z.string().min(1, 'Autó kiválasztása kötelező'),
  rentalFee: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  deposit: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  insurance: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  deliveryFee: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  extrasFee: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

type BookingRequestButtonProps = {
  quoteId: string;
  email?: string | null;
  name?: string | null;
  locale?: string | null;
  carId?: string | null;
  carName?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  monthlyPrice?: number | null;
  carOptions?: { id: string; label: string; monthlyPrices: number[] }[];
};

export const BookingRequestButton = ({
  quoteId,
  email,
  name,
  locale,
  carId,
  carName,
  rentalStart,
  rentalEnd,
  monthlyPrice,
  carOptions = [],
}: BookingRequestButtonProps) => {
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      adminName: '',
      carId: carId ?? '',
      rentalFee: '',
      deposit: '',
      insurance: '',
      deliveryFee: '',
      extrasFee: '',
    },
  });

  const missingEmail = !email;
  const missingCar = carOptions.length === 0;

  const onSubmit = (values: PricingFormValues) => {
    if (missingEmail) return;
    setStatus(null);
    startTransition(async () => {
      const rentalFee = values.rentalFee ?? undefined;
      const deposit = values.deposit ?? undefined;
      const insurance = values.insurance ?? undefined;
      const deliveryFee = values.deliveryFee ?? undefined;
      const extrasFee = values.extrasFee ?? undefined;
      const car = await getCarById(values.carId);

      const result = await sendBookingRequestEmailAction({
        quoteId,
        email,
        name,
        locale,
        carId: values.carId,
        carName: car ? `${car.manufacturer} ${car.model}` : carName,
        carImages: car?.images ?? [],
        rentalStart,
        rentalEnd,
        adminName: values.adminName,
        rentalFee,
        deposit,
        insurance,
        deliveryFee,
        extrasFee,
      });

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Foglaláskérés e-mail elküldve.',
      });
      setOpen(false);
    });
  };

  const currentMonthIndex = new Date().getMonth();

  const handleCarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    form.setValue('carId', selectedId);
  };

  const selectedCar = form.watch('carId');
  const selectedCarWeekly = (() => {
    const found = carOptions.find((c) => c.id === selectedCar);
    if (!found) return null;
    const monthly = found.monthlyPrices?.[currentMonthIndex];
    if (monthly == null) return null;
    return Math.round(monthly);
  })();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <div className='flex flex-col items-end gap-2'>
        <SheetTrigger asChild>
          <Button
            type='button'
            disabled={isPending || missingEmail || missingCar}
            className='gap-2'
          >
            <Mail className='h-4 w-4' />
            {isPending ? 'Küldés...' : 'Foglalás kérő e-mail küldése'}
          </Button>
        </SheetTrigger>

        {missingEmail && (
          <p className='text-sm text-destructive'>
            Nincs e-mail cím megadva ehhez az ajánlatkéréshez.
          </p>
        )}
        {missingCar && (
          <p className='text-sm text-destructive'>
            Nincs elérhető autó a listában, így nem küldhető ki az e-mail.
          </p>
        )}
        {status && (
          <p
            className={`text-sm ${
              status.type === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {status.message}
          </p>
        )}
      </div>

      <SheetContent side='right' className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Foglaláskérés e-mail</SheetTitle>
          <SheetDescription>
            Add meg a bérleti díjat, a kauciót és a teljes körű biztosítás díját
            az e-mailhez.
          </SheetDescription>
          {monthlyPrice != null && (
            <div className='mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground'>
              Aktuális havi díj (emlékeztető):{' '}
              <span className='font-semibold'>
                {monthlyPrice.toLocaleString()} EUR
              </span>
            </div>
          )}
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4 p-4'
          >
            <FormField
              control={form.control}
              name='carId'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='space-y-2'>
                      <label className='text-sm font-semibold text-foreground'>
                        Autó kiválasztása
                      </label>
                      <select
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCarChange(e);
                        }}
                      >
                        <option value=''>Válassz autót</option>
                        {carOptions.map((car) => (
                          <option key={car.id} value={car.id}>
                            {car.label}
                          </option>
                        ))}
                      </select>
                      {selectedCarWeekly != null && (
                        <p className='text-xs text-muted-foreground'>
                          Aktuális heti díj (emlékeztető):{' '}
                          <span className='font-semibold'>
                            {selectedCarWeekly.toLocaleString()} EUR
                          </span>
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='adminName'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='text'
                      label='Aláíró neve'
                      placeholder='pl. Kiss Péter'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='rentalFee'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      inputMode='numeric'
                      step='0.01'
                      min='0'
                      label='Bérleti díj (EUR)'
                      placeholder='pl. 300'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='deposit'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      inputMode='numeric'
                      step='0.01'
                      min='0'
                      label='Kaució (EUR)'
                      placeholder='pl. 500'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='insurance'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      inputMode='numeric'
                      step='0.01'
                      min='0'
                      label='Teljes körű biztosítás díja (EUR)'
                      placeholder='pl. 370 (opcionális)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='deliveryFee'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      inputMode='numeric'
                      step='0.01'
                      min='0'
                      label='Kiszállítás díja (EUR)'
                      placeholder='pl. 50'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='extrasFee'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      inputMode='numeric'
                      step='0.01'
                      min='0'
                      label='Extrák díja (EUR)'
                      placeholder='pl. 30'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Küldés...' : 'E-mail elküldése'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
