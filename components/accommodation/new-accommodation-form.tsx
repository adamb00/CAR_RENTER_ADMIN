'use client';
import {
  NewAccommodationSchema,
  NewAccommodationValues,
} from '@/schemas/accommodationSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FieldGroup } from '../ui/field';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useState, useTransition } from 'react';
import { createNewAccommodationAction } from '@/app/accommodations/new/action';
import { FloatingSelect } from '../ui/floating-select';

export default function NewAccommodationForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<NewAccommodationValues>({
    resolver: zodResolver(NewAccommodationSchema),
    defaultValues: {
      name: '',
      country: 'Spanyolország',
      postalCode: '',
      city: '',
      street: '',
      houseNumber: '',
      island: '',
      email: '',
    },
  });
  const handleOnSubmit = (data: NewAccommodationValues) => {
    startTransition(async () => {
      createNewAccommodationAction(data);
    });
  };

  return (
    <form className='space-y-4' onSubmit={form.handleSubmit(handleOnSubmit)}>
      <FieldGroup>
        <div className='grid grid-cols-2 space-x-2 space-y-2 gap-4'>
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
            defaultValue='Spanyolország'
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
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Mentés...' : 'Szállás létrehozása'}
      </Button>
      {/* {qrSvg ? (
        <div className='pt-2'>
          <div
            className='w-fit rounded-md border bg-white p-2'
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
      ) : null} */}
    </form>
  );
}
