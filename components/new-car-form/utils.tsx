import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { CreateCarFormInput } from '@/schemas/carSchema';

export const MAX_IMAGES = 3;
export const FORM_STORAGE_KEY = 'new-car-form-state-v6';

export const MONTH_LABELS = [
  { name: 'Január', days: 31 },
  { name: 'Február', days: 28 },
  { name: 'Március', days: 31 },
  { name: 'Április', days: 30 },
  { name: 'Május', days: 31 },
  { name: 'Június', days: 30 },
  { name: 'Július', days: 31 },
  { name: 'Augusztus', days: 31 },
  { name: 'Szeptember', days: 30 },
  { name: 'Október', days: 31 },
  { name: 'November', days: 30 },
  { name: 'December', days: 31 },
] as const;

const DEFAULT_VALUES: Partial<CreateCarFormInput> = {
  manufacturer: '',
  model: '',
  seats: undefined,
  smallLuggage: undefined,
  largeLuggage: undefined,
  bodyType: 'sedan',
  fuel: 'petrol',
  transmission: 'manual',
  monthlyPrices: Array(12).fill(undefined),
  accommodationPrices: Array.from({ length: 7 }, (_, index) => ({
    days: index + 1,
    price_eur: 0,
    full_insurance_eur: 0,
  })),
  colors: [],
  images: [],
};

export const buildDefaultValues = (
  initialValues?: Partial<CreateCarFormInput>,
): CreateCarFormInput =>
  ({
    ...DEFAULT_VALUES,
    ...initialValues,
  }) as CreateCarFormInput;

type FormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        'space-y-5 rounded-xl border bg-card/40 p-6 shadow-sm',
        className,
      )}
    >
      <div className='space-y-1.5'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {children}
    </section>
  );
}
