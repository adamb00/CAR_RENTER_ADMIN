import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { CreateCarFormInput } from '@/schemas/carSchema';

export const MAX_IMAGES = 3;
export const FORM_STORAGE_KEY = 'new-car-form-state-v5';

export const MONTH_LABELS = [
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
