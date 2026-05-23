'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { FloatingSelect } from '@/components/ui/floating-select';
import { FloatingTextarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  PAYMENT_METHOD_VALUES,
  registerNewRentSchema,
  type RegisterNewRentInput,
  type RegisterNewRentValues,
} from '@/schemas/register-new-rent-schema';
import { submitRegisterNewRentAction } from '@/app/register-new-rent/action';

type Props = {
  accommodation: {
    id: string;
    name: string;
    address: string;
    island: string;
  };
  cars: {
    id: string;
    manufacturer: string;
    model: string;
  }[];
};

export function RegisterNewRentForm({ accommodation, cars }: Props) {
  const paymentMethodLabels: Record<
    (typeof PAYMENT_METHOD_VALUES)[number],
    string
  > = {
    advance_transfer: 'Advance transfer',
    cash_on_pickup: 'Cash on pickup',
    card_on_pickup: 'Card on pickup',
    bizum_on_pickup: 'Bizum on pickup',
    revolut_on_pickup: 'Revolut on pickup',
  };

  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const form = useForm<RegisterNewRentInput, unknown, RegisterNewRentValues>({
    resolver: zodResolver(registerNewRentSchema),
    defaultValues: {
      accommodationId: accommodation.id,
      locale: 'en',
      name: '',
      email: '',
      phone: '',
      rentalStart: '',
      rentalEnd: '',
      wantsInsurance: false,
      selectedCarId: '',
      paymentMethod: '',
      cars: '1',
      partySize: '',
      children: '',
      arrivalHour: '',
      arrivalMinute: '',
      notes: '',
      driverName: '',
      driverPostalCode: '',
      driverCity: '',
      driverCountry: '',
      driverStreet: '',
      driverHouseNumber: '',
      driverBirthDate: '',
      driverPhone: '',
      driverEmail: '',
      driverLicenseNumber: '',
      driverLicenseCategory: '',
      driverLicenseExpiryDate: '',
      driverLicenseOlderThan3Years: false,
      billingSameAsPrimaryDriver: false,
      billingName: '',
      billingPostalCode: '',
      billingCity: '',
      billingCountry: '',
      billingStreet: '',
      billingHouseNumber: '',
      billingTaxNumber: '',
      billingCompanyName: '',
    },
  });

  const billingSameAsPrimaryDriver = form.watch('billingSameAsPrimaryDriver');
  const watchedDriverName = form.watch('driverName');
  const watchedDriverPostalCode = form.watch('driverPostalCode');
  const watchedDriverCity = form.watch('driverCity');
  const watchedDriverCountry = form.watch('driverCountry');
  const watchedDriverStreet = form.watch('driverStreet');
  const watchedDriverHouseNumber = form.watch('driverHouseNumber');
  const fillBillingFromPrimaryDriver = useCallback(() => {
    form.setValue('billingName', watchedDriverName ?? '', {
      shouldDirty: true,
    });
    form.setValue('billingPostalCode', watchedDriverPostalCode ?? '', {
      shouldDirty: true,
    });
    form.setValue('billingCity', watchedDriverCity ?? '', {
      shouldDirty: true,
    });
    form.setValue('billingCountry', watchedDriverCountry ?? '', {
      shouldDirty: true,
    });
    form.setValue('billingStreet', watchedDriverStreet ?? '', {
      shouldDirty: true,
    });
    form.setValue('billingHouseNumber', watchedDriverHouseNumber ?? '', {
      shouldDirty: true,
    });
  }, [
    form,
    watchedDriverCity,
    watchedDriverCountry,
    watchedDriverHouseNumber,
    watchedDriverName,
    watchedDriverPostalCode,
    watchedDriverStreet,
  ]);

  useEffect(() => {
    if (!billingSameAsPrimaryDriver) return;
    fillBillingFromPrimaryDriver();
  }, [billingSameAsPrimaryDriver, fillBillingFromPrimaryDriver]);

  const onSubmit = (values: RegisterNewRentValues) => {
    setServerMessage(null);
    startTransition(async () => {
      const result = await submitRegisterNewRentAction(values);
      if (!result.ok) {
        setServerMessage({ type: 'error', text: result.message });
        return;
      }
      form.reset({
        ...form.getValues(),
        name: '',
        email: '',
        phone: '',
        rentalStart: '',
        rentalEnd: '',
        wantsInsurance: false,
        selectedCarId: '',
        paymentMethod: '',
        cars: '1',
        partySize: '',
        children: '',
        arrivalHour: '',
        arrivalMinute: '',
        notes: '',
        driverName: '',
        driverPostalCode: '',
        driverCity: '',
        driverCountry: '',
        driverStreet: '',
        driverHouseNumber: '',
        driverBirthDate: '',
        driverPhone: '',
        driverEmail: '',
        driverLicenseNumber: '',
        driverLicenseCategory: '',
        driverLicenseExpiryDate: '',
        driverLicenseOlderThan3Years: false,
        billingSameAsPrimaryDriver: false,
        billingName: '',
        billingPostalCode: '',
        billingCity: '',
        billingCountry: '',
        billingStreet: '',
        billingHouseNumber: '',
        billingTaxNumber: '',
        billingCompanyName: '',
      });
      setServerMessage({
        type: 'success',
        text: result.humanId
          ? `Submitted successfully. Request ID: ${result.humanId}`
          : result.message,
      });
    });
  };

  const errorText = (name: keyof RegisterNewRentValues) =>
    form.formState.errors[name]?.message;

  return (
    <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
      <input type='hidden' {...form.register('accommodationId')} />
      <input type='hidden' {...form.register('locale')} />

      <div className='space-y-4'>
        <h2 className='text-base font-semibold sm:text-lg'>Contact details</h2>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          <Controller
            name='name'
            control={form.control}
            render={({ field }) => <Input label='Full name' {...field} />}
          />
          <Controller
            name='email'
            control={form.control}
            render={({ field }) => (
              <Input label='Email' type='email' {...field} />
            )}
          />
          <Controller
            name='phone'
            control={form.control}
            render={({ field }) => <Input label='Phone number' {...field} />}
          />
        </div>
      </div>

      <div className='space-y-6'>
        <h2 className='text-base font-semibold sm:text-lg'>Rental details</h2>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          <Controller
            name='rentalStart'
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label='Rental start date'
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder='Select date'
                allowClear
              />
            )}
          />
          <Controller
            name='rentalEnd'
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label='Rental end date'
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder='Select date'
                allowClear
              />
            )}
          />
          <Controller
            name='selectedCarId'
            control={form.control}
            render={({ field }) => (
              <FloatingSelect
                label='Car (optional)'
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              >
                <option value=''>Select a car</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.manufacturer} {car.model}
                  </option>
                ))}
              </FloatingSelect>
            )}
          />
          <Controller
            name='paymentMethod'
            control={form.control}
            render={({ field }) => (
              <FloatingSelect
                label='Payment method (optional)'
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              >
                <option value=''>Select payment method</option>
                {PAYMENT_METHOD_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {paymentMethodLabels[value]}
                  </option>
                ))}
              </FloatingSelect>
            )}
          />
          <Controller
            name='cars'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Number of cars'
                type='text'
                min={1}
                value={field.value ?? '1'}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
          <Controller
            name='children'
            control={form.control}
            render={({ field }) => (
              <Input label='Children (optional)' {...field} />
            )}
          />
          <Controller
            name='partySize'
            control={form.control}
            render={({ field }) => (
              <Input label='Party size (optional)' {...field} />
            )}
          />

          <Controller
            name='arrivalHour'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Arrival hour (0-23)'
                type='number'
                min={0}
                max={23}
                {...field}
              />
            )}
          />
          <Controller
            name='arrivalMinute'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Arrival minute (0-59)'
                type='number'
                min={0}
                max={59}
                {...field}
              />
            )}
          />
        </div>
      </div>

      <Controller
        name='notes'
        control={form.control}
        render={({ field }) => (
          <FloatingTextarea label='Notes for handover (optional)' {...field} />
        )}
      />

      <div className='space-y-4 rounded-lg border p-4 sm:p-5'>
        <h3 className='text-base font-semibold'>Primary driver details</h3>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          <Controller
            name='driverName'
            control={form.control}
            render={({ field }) => <Input label='Name' {...field} />}
          />
          <Controller
            name='driverBirthDate'
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label='Birth date'
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder='Select date'
                allowClear
              />
            )}
          />
          <Controller
            name='driverPhone'
            control={form.control}
            render={({ field }) => <Input label='Phone number' {...field} />}
          />
          <Controller
            name='driverEmail'
            control={form.control}
            render={({ field }) => (
              <Input label='Email' type='email' {...field} />
            )}
          />
          <Controller
            name='driverPostalCode'
            control={form.control}
            render={({ field }) => <Input label='Postal code' {...field} />}
          />
          <Controller
            name='driverCity'
            control={form.control}
            render={({ field }) => <Input label='City' {...field} />}
          />
          <Controller
            name='driverCountry'
            control={form.control}
            render={({ field }) => <Input label='Country' {...field} />}
          />
          <Controller
            name='driverStreet'
            control={form.control}
            render={({ field }) => <Input label='Street' {...field} />}
          />
          <Controller
            name='driverHouseNumber'
            control={form.control}
            render={({ field }) => <Input label='House number' {...field} />}
          />
          <Controller
            name='driverLicenseNumber'
            control={form.control}
            render={({ field }) => (
              <Input label='Driver license number' {...field} />
            )}
          />
          <Controller
            name='driverLicenseCategory'
            control={form.control}
            render={({ field }) => (
              <Input label='Highest license category' {...field} />
            )}
          />
          <Controller
            name='driverLicenseExpiryDate'
            control={form.control}
            render={({ field }) => (
              <DatePicker
                label='License expiry date'
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder='Select date'
                allowClear
              />
            )}
          />
        </div>
        <Controller
          name='driverLicenseOlderThan3Years'
          control={form.control}
          render={({ field }) => (
            <label className='flex items-center gap-2 text-sm font-medium text-foreground'>
              <input
                type='checkbox'
                checked={Boolean(field.value)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  field.onChange(checked);
                  if (checked) fillBillingFromPrimaryDriver();
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              I declare that my driver license is older than 3 years.
            </label>
          )}
        />
      </div>

      <div className='space-y-3 rounded-lg border p-4 sm:p-5'>
        <h3 className='text-base font-semibold'>Billing details</h3>
        <Controller
          name='billingSameAsPrimaryDriver'
          control={form.control}
          render={({ field }) => (
            <label className='flex items-center gap-2 text-sm font-medium text-foreground'>
              <input
                type='checkbox'
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              Same as primary driver details
            </label>
          )}
        />
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          <Controller
            name='billingName'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing name'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingPostalCode'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing postal code'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingCity'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing city'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingCountry'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing country'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingStreet'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing street'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingHouseNumber'
            control={form.control}
            render={({ field }) => (
              <Input
                label='Billing house number'
                disabled={billingSameAsPrimaryDriver}
                {...field}
              />
            )}
          />
          <Controller
            name='billingTaxNumber'
            control={form.control}
            render={({ field }) => (
              <Input label='Tax number (optional)' {...field} />
            )}
          />
          <Controller
            name='billingCompanyName'
            control={form.control}
            render={({ field }) => (
              <Input label='Company name (optional)' {...field} />
            )}
          />
        </div>
      </div>

      <Controller
        name='wantsInsurance'
        control={form.control}
        render={({ field }) => (
          <div className='space-y-1 rounded-md border p-3'>
            <label className='flex items-center gap-2 text-sm font-medium text-foreground'>
              <input
                type='checkbox'
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              I want full insurance coverage
            </label>
            <p className='text-sm text-muted-foreground'>
              If you choose full insurance coverage, no security deposit is
              required.
            </p>
          </div>
        )}
      />

      {Object.entries(form.formState.errors).length > 0 ? (
        <div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm leading-6 text-red-700'>
          Please fix the highlighted fields before submitting.
        </div>
      ) : null}

      <div className='grid grid-cols-1 gap-1 text-sm text-red-600'>
        {errorText('rentalStart') ? (
          <span>{errorText('rentalStart')}</span>
        ) : null}
        {errorText('rentalEnd') ? <span>{errorText('rentalEnd')}</span> : null}
        {errorText('selectedCarId') ? (
          <span>{errorText('selectedCarId')}</span>
        ) : null}
        {errorText('paymentMethod') ? (
          <span>{errorText('paymentMethod')}</span>
        ) : null}
        {errorText('cars') ? <span>{errorText('cars')}</span> : null}
        {errorText('arrivalHour') ? (
          <span>{errorText('arrivalHour')}</span>
        ) : null}
        {errorText('arrivalMinute') ? (
          <span>{errorText('arrivalMinute')}</span>
        ) : null}
        {errorText('driverName') ? (
          <span>{errorText('driverName')}</span>
        ) : null}
        {errorText('driverPostalCode') ? (
          <span>{errorText('driverPostalCode')}</span>
        ) : null}
        {errorText('driverCity') ? (
          <span>{errorText('driverCity')}</span>
        ) : null}
        {errorText('driverCountry') ? (
          <span>{errorText('driverCountry')}</span>
        ) : null}
        {errorText('driverStreet') ? (
          <span>{errorText('driverStreet')}</span>
        ) : null}
        {errorText('driverHouseNumber') ? (
          <span>{errorText('driverHouseNumber')}</span>
        ) : null}
        {errorText('driverBirthDate') ? (
          <span>{errorText('driverBirthDate')}</span>
        ) : null}
        {errorText('driverPhone') ? (
          <span>{errorText('driverPhone')}</span>
        ) : null}
        {errorText('driverEmail') ? (
          <span>{errorText('driverEmail')}</span>
        ) : null}
        {errorText('driverLicenseNumber') ? (
          <span>{errorText('driverLicenseNumber')}</span>
        ) : null}
        {errorText('driverLicenseCategory') ? (
          <span>{errorText('driverLicenseCategory')}</span>
        ) : null}
        {errorText('driverLicenseExpiryDate') ? (
          <span>{errorText('driverLicenseExpiryDate')}</span>
        ) : null}
        {errorText('billingName') ? (
          <span>{errorText('billingName')}</span>
        ) : null}
        {errorText('billingPostalCode') ? (
          <span>{errorText('billingPostalCode')}</span>
        ) : null}
        {errorText('billingCity') ? (
          <span>{errorText('billingCity')}</span>
        ) : null}
        {errorText('billingCountry') ? (
          <span>{errorText('billingCountry')}</span>
        ) : null}
        {errorText('billingStreet') ? (
          <span>{errorText('billingStreet')}</span>
        ) : null}
        {errorText('billingHouseNumber') ? (
          <span>{errorText('billingHouseNumber')}</span>
        ) : null}
      </div>

      {serverMessage ? (
        <div
          className={
            serverMessage.type === 'success'
              ? 'rounded-md border border-green-300 bg-green-50 p-3 text-sm leading-6 text-green-700'
              : 'rounded-md border border-red-300 bg-red-50 p-3 text-sm leading-6 text-red-700'
          }
        >
          {serverMessage.text}
        </div>
      ) : null}

      <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
        {isPending ? 'Submitting...' : 'Submit rental request'}
      </Button>
    </form>
  );
}
