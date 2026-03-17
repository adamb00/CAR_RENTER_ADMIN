import type { CreateCarFormInput } from '@/schemas/carSchema';

export type CarFormMode = 'create' | 'edit';

export type NewCarFormProps = {
  className?: string;
  mode?: CarFormMode;
  initialValues?: Partial<CreateCarFormInput>;
  carId?: string;
};
