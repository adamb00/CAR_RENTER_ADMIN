'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type {
  ChangeEvent,
  FocusEvent,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { createCarAction } from '@/actions/createCarAction';
import { updateCarAction } from '@/actions/updateCarAction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  CAR_BODY_TYPE_LABELS,
  CAR_BODY_TYPES,
  CAR_COLOR_LABELS,
  CAR_COLOR_SWATCH,
  CAR_COLORS,
  CAR_FUEL_LABELS,
  CAR_FUELS,
  CAR_TRANSMISSION_LABELS,
  CAR_TRANSMISSIONS,
} from '@/lib/car-options';
import { cn } from '@/lib/utils';
import {
  CreateCarFormSchema,
  type CreateCarFormValues,
  transformCarFormValues,
} from '@/schemas/carSchema';

const MAX_IMAGES = 3;
const FORM_STORAGE_KEY = 'new-car-form-state-v5';

const MONTH_LABELS = [
  'Január',
  'Február',
  'Március',
  'Április',
  'Május',
  'Június',
  'Július',
  'Augusztus',
  'Szeptember',
  'Október',
  'November',
  'December',
] as const;

const DEFAULT_VALUES: Partial<CreateCarFormValues> = {
  manufacturer: '',
  model: '',
  seats: undefined,
  smallLuggage: undefined,
  largeLuggage: undefined,
  bodyType: 'sedan',
  fuel: 'petrol',
  transmission: 'manual',
  monthlyPrices: Array(12).fill(undefined),
  colors: [],
  images: [],
};

const buildDefaultValues = (
  initialValues?: Partial<CreateCarFormValues>
): CreateCarFormValues =>
  ({
    ...DEFAULT_VALUES,
    ...initialValues,
  } as CreateCarFormValues);

type CarFormMode = 'create' | 'edit';

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

const FormSection = ({
  title,
  description,
  children,
  className,
}: FormSectionProps) => (
  <section
    className={cn(
      'space-y-5 rounded-xl border bg-card/40 p-6 shadow-sm',
      className
    )}
  >
    <div className='space-y-1.5'>
      <h3 className='text-lg font-semibold'>{title}</h3>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
    {children}
  </section>
);

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

const FloatingSelect = ({
  className,
  label,
  onChange,
  onBlur,
  value,
  defaultValue,
  children,
  ...props
}: FloatingSelectProps) => {
  const [hasValue, setHasValue] = useState<boolean>(
    Boolean(value ?? defaultValue)
  );

  useEffect(() => {
    setHasValue(Boolean(value ?? defaultValue));
  }, [value, defaultValue]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setHasValue(event.target.value !== '');
    onChange?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLSelectElement>) => {
    setHasValue(event.target.value !== '');
    onBlur?.(event);
  };

  return (
    <div className='relative w-full'>
      <select
        className={cn(
          'peer block h-12 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm outline-none transition-all',
          'focus:border-slate-600 focus:ring-1 focus:ring-slate-600 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </select>
      <label
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all',
          'peer-focus:-top-3 peer-focus:-translate-y-0 peer-focus:translate-x-2 peer-focus:bg-background peer-focus:px-2 peer-focus:text-sm peer-focus:text-slate-600',
          hasValue &&
            '-top-0.5 translate-x-2 bg-background px-2 text-sm text-slate-600'
        )}
      >
        {label}
      </label>
    </div>
  );
};

interface NewCarFormProps {
  className?: string;
  mode?: CarFormMode;
  initialValues?: Partial<CreateCarFormValues>;
  carId?: string;
}

export function NewCarForm({
  className,
  mode = 'create',
  initialValues,
  carId,
}: NewCarFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = mode === 'edit';

  const mergedDefaultValues = useMemo<CreateCarFormValues>(
    () => buildDefaultValues(initialValues),
    [initialValues]
  );

  const form = useForm<CreateCarFormValues>({
    resolver: zodResolver(CreateCarFormSchema),
    defaultValues: mergedDefaultValues,
  });
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (isEditMode) {
      form.reset(mergedDefaultValues);
      return;
    }
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CreateCarFormValues>;
        form.reset(buildDefaultValues(parsed));
      }
    } catch (error) {
      console.warn('Nem sikerült betölteni a mentett űrlapot.', error);
    }
  }, [form, isEditMode, mergedDefaultValues]);

  useEffect(() => {
    if (isEditMode) return;
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        console.warn('Nem sikerült menteni az űrlapot.', error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    const currentImages = form.getValues('images') ?? [];
    const remainingSlots = MAX_IMAGES - currentImages.length;

    if (remainingSlots <= 0) {
      form.setError('images', {
        message: `Legfeljebb ${MAX_IMAGES} képet tölthetsz fel.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const uploadFormData = new FormData();
    filesToUpload.forEach((file) => uploadFormData.append('files', file));

    uploadFormData.append('folder', 'cars');

    setIsUploadingImages(true);
    form.clearErrors('images');

    try {
      const response = await fetch('/api/uploads/cars', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Nem sikerült feltölteni a képeket.');
      }

      interface UploadedUrlItem {
        url?: string;
      }

      interface UploadResponse {
        urls?: UploadedUrlItem[];
        error?: string;
      }

      const uploadedUrls: string[] = ((data as UploadResponse)?.urls ?? [])
        .map((item: UploadedUrlItem) => item?.url)
        .filter((url): url is string => Boolean(url));

      if (!uploadedUrls.length) {
        throw new Error('A feltöltés nem adott vissza kép URL-t.');
      }

      const nextImages = [...currentImages, ...uploadedUrls].slice(
        0,
        MAX_IMAGES
      );
      form.setValue('images', nextImages, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nem sikerült feltölteni a képeket.';
      form.setError('images', { message });
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = (values: CreateCarFormValues) => {
    setStatus(null);
    const payload = transformCarFormValues(values);

    if (isEditMode && !carId) {
      setStatus({
        type: 'error',
        message: 'Hiányzik a szerkesztett autó azonosítója.',
      });
      return;
    }

    const request = isEditMode
      ? updateCarAction({
          id: carId as string,
          values: payload,
        })
      : createCarAction(payload);

    startTransition(async () => {
      const result = await request;

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Az autó mentése sikerült.',
      });
      if (isEditMode) {
        form.reset(values);
      } else {
        form.reset(buildDefaultValues());
        localStorage.removeItem(FORM_STORAGE_KEY);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      router.push('/cars');
    });
  };

  return (
    <Card className={cn('max-w-6xl', className)}>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Autó adatainak szerkesztése' : 'Új autó felvétele'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className='space-y-10' onSubmit={form.handleSubmit(onSubmit)}>
            <FormSection
              title='Alapadatok'
              description='Csak a legfontosabb mezők maradtak.'
            >
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='manufacturer'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} label='Márka' placeholder='Audi' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='model'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          label='Típus'
                          placeholder='A3 Sportback'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='bodyType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect
                          {...field}
                          value={field.value ?? ''}
                          label='Kivitel'
                        >
                          {CAR_BODY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {CAR_BODY_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </FloatingSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='fuel'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect
                          {...field}
                          value={field.value ?? ''}
                          label='Üzemanyag'
                        >
                          {CAR_FUELS.map((fuel) => (
                            <option key={fuel} value={fuel}>
                              {CAR_FUEL_LABELS[fuel]}
                            </option>
                          ))}
                        </FloatingSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='transmission'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect
                          {...field}
                          value={field.value ?? ''}
                          label='Váltó'
                        >
                          {CAR_TRANSMISSIONS.map((gear) => (
                            <option key={gear} value={gear}>
                              {CAR_TRANSMISSION_LABELS[gear]}
                            </option>
                          ))}
                        </FloatingSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='seats'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          inputMode='numeric'
                          min={1}
                          label='Szállítható személyek'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='smallLuggage'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label='Kis bőröndök száma'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='largeLuggage'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label='Nagy bőröndök száma'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title='Havi árak'
              description='Add meg a 12 hónapra vonatkozó árakat (EUR).'
            >
              <FormField
                control={form.control}
                name='monthlyPrices'
                render={({ field }) => {
                  const prices: (number | undefined)[] = (() => {
                    const incoming = field.value ?? [];
                    if (incoming.length === 12) return incoming;
                    const normalized = Array.from(
                      { length: 12 },
                      (_, idx) => incoming[idx]
                    );
                    return normalized;
                  })();

                  const handleChange = (index: number, value: string) => {
                    const nextPrices = [...prices];
                    nextPrices[index] =
                      value === '' ? undefined : Number(value);
                    field.onChange(nextPrices);
                  };

                  return (
                    <FormItem className='space-y-3'>
                      <FormLabel>Havi árak (EUR) 7 napra</FormLabel>
                      <FormControl>
                        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                          {MONTH_LABELS.map((month, index) => (
                            <div key={month} className='space-y-1.5'>
                              <Input
                                type='number'
                                inputMode='numeric'
                                min={0}
                                label={month}
                                value={prices[index] ?? ''}
                                onChange={(event) =>
                                  handleChange(index, event.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </FormSection>

            <FormSection
              title='Színek'
              description='Add meg, milyen karosszéria színekben érhető el az autó. Többet is választhatsz.'
            >
              <FormField
                control={form.control}
                name='colors'
                render={({ field }) => {
                  const selectedColors = field.value ?? [];

                  const toggleColor = (color: (typeof CAR_COLORS)[number]) => {
                    const isSelected = selectedColors.includes(color);
                    const nextValue = isSelected
                      ? selectedColors.filter((item) => item !== color)
                      : [...selectedColors, color];

                    field.onChange(nextValue);
                  };

                  return (
                    <FormItem className='space-y-4'>
                      <FormLabel>Elérhető színek</FormLabel>
                      <FormControl>
                        <div className='space-y-3'>
                          <div className='flex flex-wrap gap-2'>
                            {selectedColors.length === 0 ? (
                              <span className='text-sm text-muted-foreground'>
                                Még nincs kiválasztott szín.
                              </span>
                            ) : (
                              selectedColors.map((color) => (
                                <span
                                  key={color}
                                  className='inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm'
                                >
                                  <span
                                    className='h-4 w-4 rounded-full border border-black/10'
                                    style={{
                                      backgroundColor: CAR_COLOR_SWATCH[color],
                                    }}
                                    aria-hidden
                                  />
                                  {CAR_COLOR_LABELS[color]}
                                </span>
                              ))
                            )}
                          </div>
                          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
                            {CAR_COLORS.map((color) => {
                              const isSelected = selectedColors.includes(color);
                              return (
                                <button
                                  key={color}
                                  type='button'
                                  onClick={() => toggleColor(color)}
                                  className={cn(
                                    'flex items-center justify-between rounded-md border px-3 py-2 text-sm transition',
                                    isSelected
                                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                      : 'hover:border-primary/60'
                                  )}
                                >
                                  <span className='flex items-center gap-2'>
                                    <span
                                      className='h-5 w-5 rounded-full border border-black/10'
                                      style={{
                                        backgroundColor:
                                          CAR_COLOR_SWATCH[color],
                                      }}
                                      aria-hidden
                                    />
                                    {CAR_COLOR_LABELS[color]}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-xs font-semibold uppercase tracking-wide',
                                      isSelected
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    )}
                                  >
                                    {isSelected ? 'Kiválasztva' : 'Hozzáadás'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </FormSection>

            <FormSection
              title='Fotók'
              description='Legalább egy, legfeljebb három kép.'
            >
              <FormField
                control={form.control}
                name='images'
                render={({ field }) => {
                  const selectedImages = field.value ?? [];
                  const imagesLeft = MAX_IMAGES - selectedImages.length;

                  const handleRemoveImage = (url: string) => {
                    const nextImages = selectedImages.filter(
                      (image) => image !== url
                    );
                    field.onChange(nextImages);
                  };

                  return (
                    <FormItem className='space-y-3'>
                      <FormLabel>Autó fotók</FormLabel>
                      <FormControl>
                        <div className='space-y-3'>
                          <div
                            className={cn(
                              'flex flex-wrap gap-3 rounded-md border border-dashed p-4',
                              !selectedImages.length &&
                                'justify-center text-sm text-muted-foreground'
                            )}
                          >
                            {selectedImages.length === 0 && (
                              <p>Még nincs feltöltött kép.</p>
                            )}
                            {selectedImages.map((image) => (
                              <div
                                key={image}
                                className='group relative h-32 w-32 overflow-hidden rounded-md border'
                              >
                                <Image
                                  src={image}
                                  alt='Feltöltött autó kép'
                                  className='h-full w-full object-cover'
                                  fill
                                  sizes='128px'
                                />
                                <button
                                  type='button'
                                  className='absolute right-1 top-1 rounded-full bg-background/80 p-1 text-slate-600 transition hover:text-destructive'
                                  onClick={() => handleRemoveImage(image)}
                                  aria-label='Kép törlése'
                                >
                                  <X className='h-3 w-3' />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                            <Button
                              type='button'
                              variant='outline'
                              disabled={imagesLeft <= 0 || isUploadingImages}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className='mr-2 h-4 w-4' />
                              {isUploadingImages
                                ? 'Feltöltés...'
                                : 'Képek feltöltése'}
                            </Button>
                            <p className='text-xs text-muted-foreground'>
                              Minimum 1, maximum {MAX_IMAGES} kép. Egyszerre
                              több fájlt is kiválaszthatsz.
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            multiple
                            className='hidden'
                            onChange={(event) =>
                              handleImageUpload(event.target.files)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </FormSection>

            {status && (
              <div
                className={cn(
                  'rounded-md border px-4 py-3 text-sm',
                  status.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-destructive/40 bg-destructive/10 text-destructive-foreground'
                )}
              >
                {status.message}
              </div>
            )}

            <Button
              type='submit'
              size='lg'
              disabled={isPending}
              className='w-full md:w-auto'
            >
              {isPending
                ? 'Mentés...'
                : isEditMode
                ? 'Autó módosítása'
                : 'Autó felvitele'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
