'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageCircle, Plus, Send, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createContactQuoteAction } from '@/actions/createContactQuoteAction';
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
import { LOCALE_LABELS } from '@/lib/constants';
import { useRouter } from 'next/navigation';

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
  deposit: optionalPrice,
  insurance: optionalPrice,
  deliveryFee: optionalPrice,
  deliveryLocation: optionalText,
  extrasFee: optionalPrice,
});

const SUPPORTED_LOCALE_CODES = Object.keys(LOCALE_LABELS);
const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALE_CODES);
const isSupportedLocale = (value?: string | null): value is string =>
  Boolean(value && SUPPORTED_LOCALE_SET.has(value));

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const quoteSendSchema = z
  .object({
    quoteMode: z.enum(['existing', 'new']),
    quoteId: z.string().default(''),
    channel: z.enum(['email', 'whatsapp']),
    sendLocale: z.string().default('en'),
    adminName: z.string().min(1, 'Név kötelező'),
    newName: z.string().default(''),
    newEmail: z.string().default(''),
    newPhone: z.string().default(''),
    newRentalStart: z.string().default(''),
    newRentalEnd: z.string().default(''),
    newCarId: z.string().default(''),
    offers: z.array(offerSchema).min(1, 'Legalább egy ajánlat szükséges'),
  })
  .superRefine((values, ctx) => {
    if (values.quoteMode === 'existing' && !values.quoteId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ajánlatkérés kiválasztása kötelező',
        path: ['quoteId'],
      });
    }

    if (!isSupportedLocale(values.sendLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Válassz nyelvet a listából',
        path: ['sendLocale'],
      });
    }

    if (values.quoteMode !== 'new') return;

    const newEmail = values.newEmail.trim();
    const newPhone = values.newPhone.trim();

    if (!values.newName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Név kötelező',
        path: ['newName'],
      });
    }

    if (values.channel === 'email') {
      if (!newEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-mail kötelező',
          path: ['newEmail'],
        });
      } else if (!z.string().email().safeParse(newEmail).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Érvényes e-mail címet adj meg',
          path: ['newEmail'],
        });
      }
    } else if (!newPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefonszám kötelező',
        path: ['newPhone'],
      });
    }

    if (
      values.newRentalStart.trim() &&
      !DATE_INPUT_PATTERN.test(values.newRentalStart.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['newRentalStart'],
      });
    }

    if (
      values.newRentalEnd.trim() &&
      !DATE_INPUT_PATTERN.test(values.newRentalEnd.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes dátum szükséges (ÉÉÉÉ-HH-NN)',
        path: ['newRentalEnd'],
      });
    }

    const start = values.newRentalStart.trim();
    const end = values.newRentalEnd.trim();
    if (start && end && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A záró dátum nem lehet korábbi a kezdésnél',
        path: ['newRentalEnd'],
      });
    }
  });

type QuoteSendFormValues = z.output<typeof quoteSendSchema>;
type QuoteSendFormInputs = z.input<typeof quoteSendSchema>;

type QuoteOption = {
  id: string;
  humanId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: 'email' | 'phone' | 'whatsapp' | 'viber' | null;
  locale?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  carId?: string | null;
};

type CarOption = {
  id: string;
  label: string;
  monthlyPrices: number[];
  images: string[];
};

type SendQuoteButtonProps = {
  quotes: QuoteOption[];
  carOptions: CarOption[];
};

export function SendQuoteButton({ quotes, carOptions }: SendQuoteButtonProps) {
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const monthIndex = new Date().getMonth();

  const form = useForm<QuoteSendFormInputs, any, QuoteSendFormValues>({
    resolver: zodResolver(quoteSendSchema),
    defaultValues: {
      quoteMode: 'new',
      quoteId: quotes[0]?.id ?? '',
      channel: 'email',
      sendLocale:
        quotes[0]?.locale &&
        isSupportedLocale(quotes[0].locale.trim().toLowerCase())
          ? quotes[0].locale.trim().toLowerCase()
          : 'en',
      adminName: '',
      newName: '',
      newEmail: '',
      newPhone: '',
      newRentalStart: '',
      newRentalEnd: '',
      newCarId: '',
      offers: [
        {
          carId: quotes[0]?.carId ?? '',
          rentalFee: '',
          deposit: '',
          insurance: '',
          deliveryFee: '',
          deliveryLocation: '',
          extrasFee: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'offers',
  });

  const quotesById = useMemo(
    () => new Map(quotes.map((quote) => [quote.id, quote])),
    [quotes],
  );
  const carsById = useMemo(
    () => new Map(carOptions.map((car) => [car.id, car])),
    [carOptions],
  );

  const selectedQuoteId = form.watch('quoteId');
  const selectedQuoteMode = form.watch('quoteMode');
  const selectedChannel = form.watch('channel');
  const selectedSendLocale = form.watch('sendLocale');
  const newEmail = form.watch('newEmail');
  const newPhone = form.watch('newPhone');
  const newCarId = form.watch('newCarId');
  const selectedQuote = selectedQuoteId
    ? quotesById.get(selectedQuoteId)
    : null;

  useEffect(() => {
    if (selectedQuoteMode !== 'existing' || !selectedQuote?.carId) return;
    const current = form.getValues('offers.0.carId');
    if (!current || !current.trim()) {
      form.setValue('offers.0.carId', selectedQuote.carId);
    }
  }, [form, selectedQuote?.carId, selectedQuoteMode]);

  useEffect(() => {
    if (selectedQuoteMode !== 'new' || !newCarId?.trim()) return;
    const current = form.getValues('offers.0.carId');
    if (!current?.trim()) {
      form.setValue('offers.0.carId', newCarId.trim());
    }
  }, [form, newCarId, selectedQuoteMode]);

  useEffect(() => {
    if (selectedQuoteMode !== 'existing') return;
    const quoteLocale = selectedQuote?.locale?.trim().toLowerCase();
    if (!isSupportedLocale(quoteLocale)) return;
    form.setValue('sendLocale', quoteLocale, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [form, selectedQuote?.locale, selectedQuoteMode]);

  useEffect(() => {
    if (selectedQuoteMode !== 'existing') return;
    if (selectedQuote?.preferredChannel !== 'whatsapp') return;
    form.setValue('channel', 'whatsapp', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [form, selectedQuote?.preferredChannel, selectedQuoteMode]);

  const effectiveSelectedChannel =
    selectedQuoteMode === 'existing' &&
    selectedQuote?.preferredChannel === 'whatsapp'
      ? 'whatsapp'
      : selectedChannel;

  const missingEmail =
    effectiveSelectedChannel === 'email' &&
    (selectedQuoteMode === 'existing'
      ? !selectedQuote?.email?.trim()
      : !newEmail?.trim());
  const missingPhone =
    effectiveSelectedChannel === 'whatsapp' &&
    (selectedQuoteMode === 'existing'
      ? !selectedQuote?.phone?.trim()
      : !newPhone?.trim());
  const selectedSendLocaleLabel =
    (selectedSendLocale && LOCALE_LABELS[selectedSendLocale]) ?? 'Angol';
  const missingCar = carOptions.length === 0;
  const disabled = isPending || missingCar;

  const handleSubmit = (values: QuoteSendFormValues) => {
    const existingQuote =
      values.quoteMode === 'existing' ? quotesById.get(values.quoteId) : null;
    const effectiveChannel =
      values.quoteMode === 'existing' &&
      existingQuote?.preferredChannel === 'whatsapp'
        ? 'whatsapp'
        : values.channel;

    if (values.quoteMode === 'existing' && !existingQuote) {
      setStatus({
        type: 'error',
        message: 'A kiválasztott ajánlatkérés nem található.',
      });
      return;
    }

    if (
      effectiveChannel === 'email' &&
      values.quoteMode === 'existing' &&
      !existingQuote?.email?.trim()
    ) {
      setStatus({
        type: 'error',
        message: 'A kiválasztott ajánlatkéréshez nincs e-mail cím.',
      });
      return;
    }

    if (
      effectiveChannel === 'whatsapp' &&
      values.quoteMode === 'existing' &&
      !existingQuote?.phone?.trim()
    ) {
      setStatus({
        type: 'error',
        message: 'A kiválasztott ajánlatkéréshez nincs telefonszám.',
      });
      return;
    }

    setStatus(null);
    startTransition(async () => {
      const offers = values.offers.map((offer) => {
        const car = carsById.get(offer.carId);
        return {
          carId: offer.carId,
          carName: car?.label ?? null,
          carImages: car?.images ?? [],
          rentalFee: offer.rentalFee ?? undefined,
          deposit: offer.deposit ?? undefined,
          insurance: offer.insurance ?? undefined,
          deliveryFee: offer.deliveryFee ?? undefined,
          deliveryLocation: offer.deliveryLocation ?? undefined,
          extrasFee: offer.extrasFee ?? undefined,
        };
      });

      const requestedLocale = values.sendLocale.trim().toLowerCase();
      const normalizedLocale = isSupportedLocale(requestedLocale)
        ? requestedLocale
        : 'en';

      let resolvedQuote: {
        id: string;
        name: string;
        email: string;
        phone: string;
        locale: string;
        rentalStart?: string;
        rentalEnd?: string;
      } | null =
        values.quoteMode === 'existing'
          ? {
              id: existingQuote!.id,
              name: existingQuote!.name,
              email: existingQuote!.email ?? '',
              phone: existingQuote!.phone ?? '',
              locale: normalizedLocale,
              rentalStart: existingQuote!.rentalStart ?? undefined,
              rentalEnd: existingQuote!.rentalEnd ?? undefined,
            }
          : null;

      if (values.quoteMode === 'new') {
        const created = await createContactQuoteAction({
          name: values.newName,
          email: values.newEmail,
          phone: values.newPhone,
          locale: normalizedLocale,
          rentalStart: values.newRentalStart,
          rentalEnd: values.newRentalEnd,
          preferredChannel: effectiveChannel,
          carId: values.newCarId || offers[0]?.carId || undefined,
        });

        if (created.error || !created.quote) {
          setStatus({
            type: 'error',
            message:
              created.error ?? 'Az új ajánlatkérés létrehozása sikertelen.',
          });
          return;
        }

        resolvedQuote = {
          id: created.quote.id,
          name: created.quote.name,
          email: created.quote.email ?? '',
          phone: created.quote.phone ?? '',
          locale: created.quote.locale ?? normalizedLocale,
          rentalStart: created.quote.rentalStart ?? undefined,
          rentalEnd: created.quote.rentalEnd ?? undefined,
        };
      }

      if (!resolvedQuote) {
        setStatus({
          type: 'error',
          message: 'Nem sikerült feloldani az ajánlat adatait.',
        });
        return;
      }

      if (effectiveChannel === 'email') {
        const result = await sendBookingRequestEmailAction({
          quoteId: resolvedQuote.id,
          email: resolvedQuote.email,
          name: resolvedQuote.name,
          locale: resolvedQuote.locale,
          rentalStart: resolvedQuote.rentalStart,
          rentalEnd: resolvedQuote.rentalEnd,
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
        router.refresh();
        return;
      }

      const result = await sendBookingRequestWhatsappAction({
        quoteId: resolvedQuote.id,
        phone: resolvedQuote.phone,
        name: resolvedQuote.name,
        locale: resolvedQuote.locale,
        rentalStart: resolvedQuote.rentalStart,
        rentalEnd: resolvedQuote.rentalEnd,
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
      router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <div className='flex flex-col items-end gap-2'>
        <SheetTrigger asChild>
          <Button type='button' className='gap-2' disabled={disabled}>
            <Send className='h-4 w-4' />
            {isPending ? 'Küldés...' : 'Ajánlat küldése'}
          </Button>
        </SheetTrigger>
        {quotes.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            Nincs még ajánlatkérés, de itt létrehozhatsz és küldhetsz újat.
          </p>
        )}
        {missingCar && (
          <p className='text-sm text-destructive'>
            Nincs elérhető autó a listában, így nem küldhető ajánlat.
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

      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Ajánlat küldése</SheetTitle>
          <SheetDescription>
            Válassz ajánlatkérést és csatornát (e-mail vagy WhatsApp), majd add
            meg az ajánlati díjakat.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex flex-col gap-4 p-4'
          >
            <FormField
              control={form.control}
              name='quoteMode'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='space-y-2'>
                      <label className='text-sm font-semibold text-foreground'>
                        Küldés típusa
                      </label>
                      <select
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={field.value}
                        onChange={field.onChange}
                        disabled={
                          selectedQuoteMode === 'existing' &&
                          selectedQuote?.preferredChannel === 'whatsapp'
                        }
                      >
                        <option value='existing' disabled={quotes.length === 0}>
                          Meglévő ajánlatkérés
                        </option>
                        <option value='new'>Új ajánlat küldése</option>
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedQuoteMode === 'existing' && (
              <FormField
                control={form.control}
                name='quoteId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='space-y-2'>
                        <label className='text-sm font-semibold text-foreground'>
                          Ajánlatkérés
                        </label>
                        <select
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value=''>Válassz ajánlatkérést</option>
                          {quotes.map((quote) => (
                            <option key={quote.id} value={quote.id}>
                              {(quote.humanId ?? quote.id).slice(0, 18)} |{' '}
                              {quote.name} | {quote.email || quote.phone || '—'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='channel'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='space-y-2'>
                      <label className='text-sm font-semibold text-foreground'>
                        Küldési csatorna
                      </label>
                      <select
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value='email'>E-mail</option>
                        <option value='whatsapp'>WhatsApp</option>
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='sendLocale'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='space-y-2'>
                      <label className='text-sm font-semibold text-foreground'>
                        Küldési nyelv
                      </label>
                      <select
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {SUPPORTED_LOCALE_CODES.map((code) => (
                          <option key={code} value={code}>
                            {LOCALE_LABELS[code]} ({code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedQuoteMode === 'existing' && selectedQuote && (
              <div className='rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground'>
                <div>
                  Címzett: {selectedQuote.name} (
                  {selectedQuote.humanId ?? selectedQuote.id})
                </div>
                <div>E-mail: {selectedQuote.email?.trim() || '—'}</div>
                <div>Telefon: {selectedQuote.phone?.trim() || '—'}</div>
                <div>
                  Preferált csatorna:{' '}
                  {selectedQuote.preferredChannel ?? 'email'}
                </div>

                <div>
                  Küldési nyelv: {selectedSendLocaleLabel} (
                  {selectedSendLocale ?? 'en'})
                </div>
                <div>
                  Időszak: {selectedQuote.rentalStart ?? '—'} →{' '}
                  {selectedQuote.rentalEnd ?? '—'}
                </div>
              </div>
            )}

            {selectedQuoteMode === 'new' && (
              <div className='grid gap-4 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='newName'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormControl>
                        <Input
                          type='text'
                          label='Címzett neve'
                          placeholder='pl. John Doe'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='newEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type='email'
                          label='E-mail'
                          placeholder='name@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='newPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type='text'
                          label='Telefonszám'
                          placeholder='pl. +34600111222'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='newRentalStart'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='date' label='Bérlés kezdete' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='newRentalEnd'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='date' label='Bérlés vége' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {missingEmail && (
              <p className='text-sm text-destructive'>
                {selectedQuoteMode === 'existing'
                  ? 'A kiválasztott ajánlatkéréshez nincs e-mail cím.'
                  : 'Adj meg e-mail címet az új ajánlathoz.'}
              </p>
            )}
            {missingPhone && (
              <p className='text-sm text-destructive'>
                {selectedQuoteMode === 'existing'
                  ? 'A kiválasztott ajánlatkéréshez nincs telefonszám.'
                  : 'Adj meg telefonszámot az új ajánlathoz.'}
              </p>
            )}

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

            <div className='flex flex-col gap-6'>
              {fields.map((offerField, index) => {
                const selectedCarId = form.watch(`offers.${index}.carId`);
                const selectedCar = selectedCarId
                  ? carsById.get(selectedCarId)
                  : undefined;
                const monthlyPrice = selectedCar?.monthlyPrices?.[monthIndex];

                return (
                  <div
                    key={offerField.id}
                    className='rounded-xl border border-border/60 bg-muted/20 p-4'
                  >
                    <div className='mb-3 flex items-center justify-between'>
                      <h3 className='text-sm font-semibold'>
                        Ajánlat {index + 1}
                      </h3>
                      {fields.length > 1 && (
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

                    <div className='grid gap-4'>
                      <div className='flex gap-4'>
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
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                  >
                                    <option value=''>Válassz helyet</option>
                                    <option value='reptér'>Reptér</option>
                                    <option value='szálloda'>Szálloda</option>
                                  </select>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {monthlyPrice != null && (
                        <p className='text-xs text-muted-foreground'>
                          Aktuális havi díj (tájékoztató):{' '}
                          <span className='font-semibold'>
                            {monthlyPrice.toLocaleString()} EUR
                          </span>
                        </p>
                      )}

                      <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`offers.${index}.rentalFee`}
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
                          name={`offers.${index}.deposit`}
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
                          name={`offers.${index}.insurance`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  inputMode='numeric'
                                  step='0.01'
                                  min='0'
                                  label='Biztosítás (EUR)'
                                  placeholder='pl. 370'
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
                                  step='0.01'
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type='button'
              variant='outline'
              className='gap-2'
              onClick={() =>
                append({
                  carId:
                    selectedQuoteMode === 'new'
                      ? form.getValues('newCarId') ||
                        form.getValues('offers.0.carId')
                      : (selectedQuote?.carId ?? ''),
                  rentalFee: '',
                  deposit: '',
                  insurance: '',
                  deliveryFee: '',
                  deliveryLocation: '',
                  extrasFee: '',
                })
              }
            >
              <Plus className='h-4 w-4' />
              Ajánlat hozzáadása
            </Button>

            <SheetFooter>
              <Button
                type='submit'
                disabled={isPending || missingEmail || missingPhone}
              >
                {isPending ? (
                  'Küldés...'
                ) : effectiveSelectedChannel === 'email' ? (
                  <>
                    <Mail className='mr-2 h-4 w-4' />
                    E-mail küldése
                  </>
                ) : (
                  <>
                    <MessageCircle className='mr-2 h-4 w-4' />
                    WhatsApp megnyitása
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
