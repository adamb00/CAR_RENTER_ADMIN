'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { sendBookingRequestEmailAction } from '@/actions/sendBookingRequestEmailAction';
import { sendBookingRequestWhatsappAction } from '@/actions/sendBookingRequestWhatsappAction';
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
import { FloatingSelect } from '@/components/ui/floating-select';
import {
  formatAdminOfferCarsScope,
  resolveOfferCarsCount,
} from '@/lib/offer-car-count';
import { resolveOfferRentalPricing } from '@/lib/quote-offer-pricing';
import { User } from '@prisma/client';
import { getUserOptions } from '@/lib/user-options';

const optionalPrice = z
  .string()
  .transform((val): string | undefined =>
    val && val.trim().length > 0 ? val.trim() : undefined,
  );

const optionalText = z
  .string()
  .transform((val): string | undefined =>
    val && val.trim().length > 0 ? val.trim() : undefined,
  );

const offerSchema = z.object({
  carId: z.string().min(1, 'Autó kiválasztása kötelező'),
  rentalFee: optionalPrice,
  discountedRentalFee: optionalPrice,
  deposit: optionalPrice,
  insurance: optionalPrice,
  deliveryFee: optionalPrice,
  deliveryLocation: optionalText,
  extrasFee: optionalPrice,
});

const pricingSchema = z.object({
  adminName: z.string().min(1, 'Név kötelező'),
  offers: z.array(offerSchema).min(1, 'Legalább egy ajánlat szükséges'),
});

type PricingFormValues = z.output<typeof pricingSchema>;
type PricingFormInputs = z.input<typeof pricingSchema>;

type BookingRequestButtonProps = {
  quoteId: string;
  rentalDays?: number | null;
  deliveryPlaceType?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: 'email' | 'phone' | 'whatsapp' | 'viber' | null;
  name?: string | null;
  locale?: string | null;
  carId?: string | null;
  cars?: string | number | null;
  users: Pick<User, 'id' | 'name'>[];
  carName?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  monthlyPrice?: number | null;
  carOptions?: {
    id: string;
    label: string;
    monthlyPrices: number[];
    images: string[];
  }[];
};

const normalizeDeliveryLocation = (value?: string | null) => {
  if (!value) return '';

  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    airport: 'reptér',
    accommodation: 'szálloda',
    office: 'iroda',
    reptér: 'reptér',
    szálloda: 'szálloda',
    iroda: 'iroda',
  };

  return map[normalized] ?? value.trim();
};

export const BookingRequestButton = ({
  users,
  rentalDays,
  quoteId,
  email,
  phone,
  preferredChannel,
  name,
  locale,
  carId,
  cars,
  carName,
  rentalStart,
  deliveryPlaceType,
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
  const effectiveChannel =
    preferredChannel === 'whatsapp' ? 'whatsapp' : 'email';
  const appliedCarsCount = resolveOfferCarsCount(cars) ?? 1;
  const defaultDeliveryLocation = normalizeDeliveryLocation(deliveryPlaceType);

  const form = useForm<PricingFormInputs, any, PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      adminName: '',
      offers: [
        {
          carId: carId ?? '',
          rentalFee: '',
          discountedRentalFee: '',
          deposit: '',
          insurance: '',
          deliveryFee: '',
          deliveryLocation: defaultDeliveryLocation,
          extrasFee: '',
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'offers',
  });

  const [quoteType, setQuoteType] = useState<
    'standard' | 'custom' | 'resident' | null
  >(null);
  const createEmptyOffer = (selectedCarId?: string | null) => ({
    carId: selectedCarId?.trim() || carId || '',
    rentalFee: '',
    discountedRentalFee: '',
    deposit: '',
    insurance: '',
    deliveryFee: '',
    deliveryLocation: defaultDeliveryLocation,
    extrasFee: '',
  });

  useEffect(() => {
    if (!defaultDeliveryLocation) return;

    const offers = form.getValues('offers');
    offers.forEach((offer, index) => {
      if (!offer?.deliveryLocation?.trim()) {
        form.setValue(`offers.${index}.deliveryLocation`, defaultDeliveryLocation, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    });
  }, [defaultDeliveryLocation, form]);

  const missingContact = effectiveChannel === 'whatsapp' ? !phone : !email;
  const missingCar = carOptions.length === 0;
  const allowsMultipleOffers = quoteType === 'custom';

  const handleQuoteTypeChange = (
    nextType: 'standard' | 'custom' | 'resident',
  ) => {
    const currentOffers = form.getValues('offers');

    if (nextType !== 'custom') {
      const currentFirstOffer = currentOffers[0];
      const firstOffer =
        currentFirstOffer ?? createEmptyOffer(carId ?? undefined);
      replace([{ ...createEmptyOffer(firstOffer.carId), ...firstOffer }]);
    } else if (currentOffers.length === 0) {
      replace([createEmptyOffer()]);
    }

    setQuoteType(nextType);
  };

  const onSubmit = (values: PricingFormValues) => {
    if (missingContact) return;

    const rentalWeeks = rentalDays ? Math.max(1, Math.ceil(rentalDays / 7)) : 1;

    const hasWeeklyPriceConflict = values.offers.some((offer) => {
      const effectiveRentalFee =
        resolveOfferRentalPricing(offer).effectiveRentalFee;

      if (!effectiveRentalFee) {
        return false;
      }

      const selectedCar = carOptions.find(
        (option) => option.id === offer.carId,
      );
      const selectedWeeklyPrice =
        selectedCar?.monthlyPrices?.[currentMonthIndex] ?? monthlyPrice;

      if (selectedWeeklyPrice == null) {
        return false;
      }

      const rentalFee = Number(effectiveRentalFee);
      if (Number.isNaN(rentalFee)) {
        return false;
      }

      const minimumExpectedRentalFee = selectedWeeklyPrice * rentalWeeks;

      return rentalFee <= minimumExpectedRentalFee;
    });

    if (hasWeeklyPriceConflict) {
      const shouldContinue = window.confirm(
        'Legalább egy megadott bérleti díj kisebb vagy egyenlő az előre meghatározott bérleti díjnál.  Kattints az OK gombra, ha szeretnéd így is küldeni.',
      );

      if (!shouldContinue) {
        return;
      }
    }

    setStatus(null);
    startTransition(async () => {
      const offers = values.offers.map((offer) => {
        const car = carOptions.find((option) => option.id === offer.carId);
        return {
          carId: offer.carId,
          carName: car?.label ?? carName,
          carImages: car?.images ?? [],
          appliesToCars: appliedCarsCount,
          rentalFee: offer.rentalFee ?? undefined,
          discountedRentalFee: offer.discountedRentalFee ?? undefined,
          deposit: offer.deposit ?? undefined,
          insurance: offer.insurance ?? undefined,
          deliveryFee: offer.deliveryFee ?? undefined,
          deliveryLocation: offer.deliveryLocation ?? undefined,
          extrasFee: offer.extrasFee ?? undefined,
        };
      });

      if (effectiveChannel === 'whatsapp') {
        const result = await sendBookingRequestWhatsappAction({
          quoteId,
          phone,
          name,
          locale,
          rentalStart,
          rentalEnd,
          adminName: values.adminName,
          offers,
        });

        if (result?.error) {
          setStatus({ type: 'error', message: result.error });
          return;
        }

        if (result?.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
        }

        setStatus({
          type: 'success',
          message: result?.success ?? 'WhatsApp ajánlat megnyitva.',
        });
        setOpen(false);
        return;
      }

      const result = await sendBookingRequestEmailAction({
        quoteId,
        email,
        name,
        locale,
        rentalStart,
        rentalEnd,
        adminName: values.adminName,
        offers,
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

  const userOptions = getUserOptions(users);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setQuoteType(null);
        if (!isPending) setOpen(next);
      }}
    >
      <div className='flex flex-col items-end gap-2'>
        <SheetTrigger asChild>
          <Button
            type='button'
            disabled={isPending || missingContact || missingCar}
            className='gap-2'
          >
            {effectiveChannel === 'whatsapp' ? (
              <MessageCircle className='h-4 w-4' />
            ) : (
              <Mail className='h-4 w-4' />
            )}
            {isPending
              ? 'Küldés...'
              : effectiveChannel === 'whatsapp'
                ? 'Foglalás kérő WhatsApp küldése'
                : 'Foglalás kérő e-mail küldése'}
          </Button>
        </SheetTrigger>

        {missingContact && (
          <p className='text-sm text-destructive'>
            {effectiveChannel === 'whatsapp'
              ? 'Nincs telefonszám megadva ehhez az ajánlatkéréshez.'
              : 'Nincs e-mail cím megadva ehhez az ajánlatkéréshez.'}
          </p>
        )}
        {missingCar && (
          <p className='text-sm text-destructive'>
            Nincs elérhető autó a listában, így nem küldhető ki az ajánlat.
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

      <SheetContent
        side='right'
        className='w-full sm:max-w-md overflow-y-scroll'
      >
        <SheetHeader>
          <SheetTitle>
            {effectiveChannel === 'whatsapp'
              ? 'Foglaláskérés WhatsApp'
              : 'Foglaláskérés e-mail'}
          </SheetTitle>
          <SheetDescription>
            Add meg a bérleti díjat, a kauciót és a teljes körű biztosítás díját
            az ajánlathoz.
          </SheetDescription>
          <div className='mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground'>
            {formatAdminOfferCarsScope(appliedCarsCount)}
          </div>
          {monthlyPrice != null && (
            <div className='mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground'>
              Aktuális előjegyzett heti díj:{' '}
              <span className='font-semibold'>
                {(appliedCarsCount * +monthlyPrice).toLocaleString()} EUR / hét
              </span>
              <div>
                Bérelni kívánt napok száma:{' '}
                <span className='font-semibold'>{rentalDays} nap</span>
              </div>
            </div>
          )}
        </SheetHeader>

        {quoteType === null && (
          <div className='flex flex-col px-2 gap-4 mt-4'>
            <Button
              type='button'
              onClick={() => handleQuoteTypeChange('standard')}
            >
              Standard ajánlat
            </Button>
            <Button
              type='button'
              onClick={() => handleQuoteTypeChange('resident')}
            >
              Rezidens ajánlat
            </Button>
            <Button
              type='button'
              onClick={() => handleQuoteTypeChange('custom')}
            >
              Több autós ajánlat
            </Button>
          </div>
        )}

        {quoteType !== null && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-4 p-4'
            >
              <FormField
                control={form.control}
                name='adminName'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingSelect
                        label='Aláíró neve'
                        alwaysFloatLabel
                        required
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value='' disabled>
                          Kérlek válassz ki valakit!
                        </option>
                        {userOptions.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FloatingSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex flex-col gap-6'>
                {fields.map((field, index) => {
                  return (
                    <div
                      key={field.id}
                      className='rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-4'
                    >
                      <div className='mb-3 flex items-center justify-between'>
                        <h3 className='text-sm font-semibold'>
                          Ajánlat {index + 1}
                        </h3>
                        {allowsMultipleOffers && fields.length > 1 && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='gap-2'
                            onClick={() => remove(index)}
                          >
                            <Trash2 className='h-4 w-4' />
                            Törlés
                          </Button>
                        )}
                      </div>

                      <p className='text-xs font-medium text-muted-foreground'>
                        {formatAdminOfferCarsScope(appliedCarsCount)}
                      </p>

                      <FormField
                        control={form.control}
                        name={`offers.${index}.carId`}
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
                                  onChange={field.onChange}
                                >
                                  <option value=''>Válassz autót</option>
                                  {carOptions.map((car) => (
                                    <option key={car.id} value={car.id}>
                                      {car.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`offers.${index}.rentalFee`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
                                min='0'
                                label='Eredeti ár (EUR)'
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
                        name={`offers.${index}.discountedRentalFee`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
                                min='0'
                                label='Kedvezményes ár (EUR)'
                                placeholder='pl. 260'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`offers.${index}.deposit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
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
                        name={`offers.${index}.insurance`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
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
                        name={`offers.${index}.deliveryFee`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
                                min='0'
                                label='Átvétel díja (EUR)'
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
                        name={`offers.${index}.deliveryLocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className='space-y-2'>
                                <label className='text-sm font-medium text-foreground'>
                                  Átvétel helye
                                </label>
                                <select
                                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                                  value={
                                    typeof field.value === 'string'
                                      ? field.value
                                      : defaultDeliveryLocation
                                  }
                                  onChange={(event) =>
                                    field.onChange(event.target.value)
                                  }
                                >
                                  <option value=''>Válassz helyet</option>
                                  <option value='reptér'>Reptér</option>
                                  <option value='szálloda'>Szálloda</option>
                                  <option value='iroda'>Iroda</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`offers.${index}.extrasFee`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='number'
                                inputMode='numeric'
                                step='1'
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
                    </div>
                  );
                })}
              </div>

              {allowsMultipleOffers && (
                <Button
                  type='button'
                  variant='outline'
                  className='gap-2'
                  onClick={() =>
                    append(
                      createEmptyOffer(
                        form.getValues(
                          `offers.${Math.max(fields.length - 1, 0)}.carId`,
                        ),
                      ),
                    )
                  }
                >
                  <Plus className='h-4 w-4' />
                  Ajánlat hozzáadása
                </Button>
              )}

              <SheetFooter>
                <Button type='submit' disabled={isPending}>
                  {isPending
                    ? 'Küldés...'
                    : effectiveChannel === 'whatsapp'
                      ? 'WhatsApp ajánlat küldése'
                      : 'Ajánlat elküldése'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
};
