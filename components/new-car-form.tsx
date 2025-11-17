'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type {
  ChangeEvent,
  FocusEvent,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CarColorOption } from '@/lib/car-options';
import {
  CAR_BODY_TYPE_LABELS,
  CAR_BODY_TYPES,
  CAR_CATEGORIES,
  CAR_CATEGORY_LABELS,
  CAR_COLOR_LABELS,
  CAR_COLORS,
  CAR_FUEL_LABELS,
  CAR_FUELS,
  CAR_STATUS_LABELS,
  CAR_STATUSES,
  CAR_TIRE_TYPE_LABELS,
  CAR_TIRE_TYPES,
  CAR_TRANSMISSION_LABELS,
  CAR_TRANSMISSIONS,
} from '@/lib/car-options';
import { cn } from '@/lib/utils';
import {
  CreateCarFormSchema,
  type CreateCarFormValues,
  RENTAL_DAY_THRESHOLDS,
  transformCarFormValues,
} from '@/schemas/carSchema';
import { updateCarAction } from '@/actions/updateCarAction';
import { createCarAction } from '@/actions/createCarAction';

const TEXTAREA_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600';

const MAX_IMAGES = 3;
const FORM_STORAGE_KEY = 'new-car-form-state';
const DAY_THRESHOLDS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 30] as const;
type DailyPriceKey = keyof CreateCarFormValues['dailyPrices'];
const DAY_KEYS = RENTAL_DAY_THRESHOLDS.map(
  (_, index) => `day${index + 1}` as DailyPriceKey
);

function buildDailyPriceDefaults() {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = undefined as unknown as number;
    return acc;
  }, {} as CreateCarFormValues['dailyPrices']);
}

const COLOR_SWATCHES: Record<CarColorOption, string> = {
  milky_beige: '#f5efe6',
  white: '#ffffff',
  silver_metal: '#d9dfe5',
  blue: '#2563eb',
  metal_blue: '#1d3b72',
  gray: '#94a3b8',
};

const DEFAULT_VALUES: Partial<CreateCarFormValues> = {
  licensePlate: '',
  category: 'small',
  manufacturer: '',
  model: '',
  year: undefined,
  firstRegistration: '',
  bodyType: 'sedan',
  colors: [],
  images: [],
  dailyPrices: buildDailyPriceDefaults(),
  description: '',
  seats: undefined,
  odometer: undefined,
  smallLuggage: undefined,
  largeLuggage: undefined,
  transmission: 'manual',
  fuel: 'petrol',
  vin: '',
  engineNumber: '',
  fleetJoinedAt: '',
  status: 'available',
  inspectionValidUntil: '',
  tires: 'summer',
  nextServiceAt: '',
  serviceNotes: '',
  notes: '',
  knownDamages: '',
};

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

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

const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
  (
    {
      className,
      label,
      onChange,
      onBlur,
      value,
      defaultValue,
      children,
      ...props
    },
    ref
  ) => {
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
          ref={ref}
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
  }
);

FloatingSelect.displayName = 'FloatingSelect';

type CarFormMode = 'create' | 'edit';

interface NewCarFormProps {
  className?: string;
  mode?: CarFormMode;
  initialValues?: Partial<CreateCarFormValues>;
  originalLicensePlate?: string;
}

export function NewCarForm({
  className,
  mode = 'create',
  initialValues,
  originalLicensePlate,
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

  const mergedDefaultValues = useMemo<CreateCarFormValues>(() => {
    const base = {
      ...DEFAULT_VALUES,
      ...initialValues,
    };
    return {
      ...base,
      dailyPrices: {
        ...buildDailyPriceDefaults(),
        ...(initialValues?.dailyPrices ?? {}),
      },
    } as CreateCarFormValues;
  }, [initialValues]);

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
        form.reset({
          ...DEFAULT_VALUES,
          ...parsed,
          dailyPrices: {
            ...buildDailyPriceDefaults(),
            ...(parsed.dailyPrices ?? {}),
          },
        });
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
    const request = isEditMode
      ? updateCarAction({
          originalLicensePlate: originalLicensePlate ?? values.licensePlate,
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
        form.reset({
          ...DEFAULT_VALUES,
          dailyPrices: buildDailyPriceDefaults(),
        });
        localStorage.removeItem(FORM_STORAGE_KEY);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      router.push('/cars');
    });
  };

  return (
    <Card className={cn('max-w-8xl', className)}>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Autó adatainak szerkesztése' : 'Új autó felvétele'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Frissítsd az autó adatait, majd mentsd a módosításokat.'
            : 'Add meg az alábbi adatokat, hogy az autó bekerüljön a flottába.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className='space-y-10' onSubmit={form.handleSubmit(onSubmit)}>
            <FormSection
              title='Alapadatok'
              description='Rögzítsd a rendszámot, gyártót és alap állapotadatokat.'
            >
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <FormField
                  control={form.control}
                  name='licensePlate'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          label='Rendszám'
                          placeholder='ABC-123'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='manufacturer'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} label='Gyártó' placeholder='Audi' />
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
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect {...field} label='Kategória'>
                          {CAR_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {CAR_CATEGORY_LABELS[category]}
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
                  name='bodyType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect {...field} label='Kivitel'>
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
                        <FloatingSelect {...field} label='Üzemanyag'>
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
                        <FloatingSelect {...field} label='Váltó típusa'>
                          {CAR_TRANSMISSIONS.map((transmission) => (
                            <option key={transmission} value={transmission}>
                              {CAR_TRANSMISSION_LABELS[transmission]}
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
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect {...field} label='Státusz'>
                          {CAR_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {CAR_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </FloatingSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title='Időpontok & iratok'
              description='Évjárat, első forgalomba helyezés, flottába vétel és kötelező szervizek.'
            >
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-5'>
                <FormField
                  control={form.control}
                  name='year'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          inputMode='numeric'
                          label='Évjárat'
                          min={1980}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='firstRegistration'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker
                          label='Első forgalomba helyezés'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='fleetJoinedAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker
                          label='Flottába vétel'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='inspectionValidUntil'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker
                          label='Műszaki érvényesség'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='nextServiceAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker
                          label='Következő szerviz (opcionális)'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          allowClear
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title='Specifikációk'
              description='Kapacitás, csomagtér, színek és azonosítók.'
            >
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
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
                  name='odometer'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          inputMode='numeric'
                          min={0}
                          label='Kilométeróra állás (km)'
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
                          label='Kis csomagtér (db)'
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
                          label='Nagy csomagtér (db)'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='colors'
                  render={({ field }) => {
                    const selectedColors = field.value ?? [];
                    const toggleColor = (color: CarColorOption) => {
                      const nextValue = selectedColors.includes(color)
                        ? selectedColors.filter((item) => item !== color)
                        : [...selectedColors, color];
                      field.onChange(nextValue);
                    };

                    return (
                      <FormItem className='md:col-span-2 lg:col-span-4'>
                        <FormLabel>Elérhető színek</FormLabel>
                        <FormControl>
                          <div className='flex flex-wrap gap-2'>
                            {CAR_COLORS.map((color) => {
                              const isSelected = selectedColors.includes(color);
                              return (
                                <button
                                  type='button'
                                  key={color}
                                  onClick={() => toggleColor(color)}
                                  className={cn(
                                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                                    isSelected
                                      ? 'border-slate-600 bg-slate-100 text-slate-900'
                                      : 'border-input text-muted-foreground hover:border-slate-400 hover:text-slate-900'
                                  )}
                                  aria-pressed={isSelected}
                                >
                                  <span
                                    className='h-4 w-4 rounded-full border border-border'
                                    style={{
                                      backgroundColor: COLOR_SWATCHES[color],
                                    }}
                                  />
                                  {CAR_COLOR_LABELS[color]}
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name='vin'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          label='Alvázszám'
                          placeholder='WAUZZZ...'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='engineNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          label='Motorszám'
                          placeholder='DASF12345'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='tires'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingSelect {...field} label='Gumik típusa'>
                          {CAR_TIRE_TYPES.map((tire) => (
                            <option key={tire} value={tire}>
                              {CAR_TIRE_TYPE_LABELS[tire]}
                            </option>
                          ))}
                        </FloatingSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title='Árazás'
              description='Adj meg külön árat a megadott bérlési hosszaktól (1, 2, 3, 4, 5, 6, 7, 10, 14, 30 nap).'
            >
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-5'>
                {DAY_THRESHOLDS.map((threshold, index) => (
                  <FormField
                    key={threshold}
                    control={form.control}
                    name={`dailyPrices.day${index + 1}` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            inputMode='numeric'
                            min={1}
                            label={`${threshold} naptól (EUR)`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormSection>

            <FormSection
              title='Leírás és média'
              description='Add meg a flottában megjelenő képeket és marketing leírást.'
            >
              <div className='grid gap-6 md:grid-cols-2'>
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
                                  <img
                                    src={image}
                                    alt='Feltöltött autó kép'
                                    className='h-full w-full object-cover'
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
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leírás</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className={cn(TEXTAREA_CLASS, 'min-h-[140px]')}
                          placeholder='Röviden mutasd be az autót...'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title='Szerviz, megjegyzések'
              description='Jegyezd fel a legutóbbi szervizt, ismert sérüléseket vagy speciális tudnivalókat.'
            >
              <div className='grid gap-6 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='serviceNotes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Szerviz jegyzet</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className={cn(TEXTAREA_CLASS, 'min-h-[120px]')}
                          placeholder='Utolsó szerviz részletei...'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Belső megjegyzés</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className={cn(TEXTAREA_CLASS, 'min-h-[120px]')}
                          placeholder='Speciális szabályok, extra tudnivalók...'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='knownDamages'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ismert sérülések</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className={cn(TEXTAREA_CLASS, 'min-h-[120px]')}
                          placeholder='Karc a jobb hátsó ajtón...'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

            {isEditMode ? (
              <Button
                type='submit'
                size='lg'
                disabled={isPending}
                className='w-full md:w-auto'
              >
                {isPending ? 'Mentés...' : 'Autó módosítása'}
              </Button>
            ) : (
              <Button
                type='submit'
                size='lg'
                disabled={isPending}
                className='w-full md:w-auto'
              >
                {isPending ? 'Mentés...' : 'Autó felvitele'}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
