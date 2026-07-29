import type { CreateCarFormInput } from '@/schemas/carSchema';

export type CarFormMode = 'create' | 'edit';

export type InitialCarPrice = {
  date: string;
  island: 'lanzarote' | 'fuerteventura';
  price: number;
  action: boolean;
};

export type NewCarFormProps = {
  className?: string;
  mode?: CarFormMode;
  initialValues?: Partial<CreateCarFormInput>;
  carId?: string;
  initialPrices?: InitialCarPrice[];
  initialDailyMultipliers?: Record<string, number>;
};
