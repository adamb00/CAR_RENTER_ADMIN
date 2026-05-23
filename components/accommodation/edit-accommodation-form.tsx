'use client';

import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { updateAccommodationAction } from '@/app/accommodations/[id]/action';
import {
  NewAccommodationSchema,
  type NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';

type EditAccommodationFormProps = {
  accommodationId: string;
  initialValues: NewAccommodationValues;
};

export default function EditAccommodationForm({
  accommodationId,
  initialValues,
}: EditAccommodationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<NewAccommodationValues>({
    resolver: zodResolver(NewAccommodationSchema),
    defaultValues: initialValues,
  });

  const handleOnSubmit = (data: NewAccommodationValues) => {
    setStatus(null);
    startTransition(async () => {
      const result = await updateAccommodationAction({
        id: accommodationId,
        values: data,
      });

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'A szállás adatai frissültek.',
      });
    });
  };

  return (
    <form className='space-y-4' onSubmit={form.handleSubmit(handleOnSubmit)}>
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Controller
            name='name'
            control={form.control}
            render={({ field }) => <Input label='Szállás neve' {...field} />}
          />
          <Controller
            name='country'
            control={form.control}
            render={({ field }) => <Input label='Ország' {...field} />}
          />
          <Controller
            name='postalCode'
            control={form.control}
            render={({ field }) => <Input label='Irányítószám' {...field} />}
          />
          <Controller
            name='city'
            control={form.control}
            render={({ field }) => <Input label='Város' {...field} />}
          />
          <Controller
            name='street'
            control={form.control}
            render={({ field }) => <Input label='Utca' {...field} />}
          />
          <Controller
            name='houseNumber'
            control={form.control}
            render={({ field }) => <Input label='Házszám' {...field} />}
          />
          <Controller
            name='island'
            control={form.control}
            render={({ field }) => (
              <FloatingSelect
                label='Sziget'
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              >
                <option value=''>Nincs megadva</option>
                <option value='Lanzarote'>Lanzarote</option>
                <option value='Fuerteventura'>Fuerteventura</option>
              </FloatingSelect>
            )}
          />
          <Controller
            name='email'
            control={form.control}
            render={({ field }) => (
              <Input label='Szálláshoz tartozó email' type='email' {...field} />
            )}
          />
        </div>
      </FieldGroup>

      {status && (
        <div
          className={
            status.type === 'success'
              ? 'rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
              : 'rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground'
          }
        >
          {status.message}
        </div>
      )}

      <Button type='submit' disabled={isPending}>
        {isPending ? 'Mentés...' : 'Szállás adatainak mentése'}
      </Button>
    </form>
  );
}
