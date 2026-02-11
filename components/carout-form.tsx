'use client';
import React, { useMemo, useState } from 'react';
import { FloatingSelect } from './ui/floating-select';
import { Input } from './ui/input';

import { Booking } from '@/data-service/bookings';
import Section from './ui/section';
import { Detail } from './ui/detail';

const emptyForm = {
  take: '',
  date: '',
  time: '',
  milage: '',
};

const takeOptions = [
  { value: 'John Doe', label: 'John Doe' },
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'Alice Johnson', label: 'Alice Johnson' },
];

type CaroutFormProps = {
  booking: Booking | null;
};

type CaroutFormValues = typeof emptyForm;
export default function CaroutForm({ booking }: CaroutFormProps) {
  console.log(booking);
  const normalizedInitialValues = useMemo(() => emptyForm, []);
  const [form, setForm] = useState<CaroutFormValues>(normalizedInitialValues);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form submitted');
  };
  return (
    <div>
      <div className='grid md:grid-cols-3 w-full gap-4 mb-6'>
        <Detail label='Foglaló neve' value={booking?.contactName} />
        <Detail label='E-mail' value={booking?.contactEmail} />
        <Detail label='Telefonszám' value={booking?.contactPhone} />
      </div>
      <div className='grid md:grid-cols-4 w-full gap-4 mb-6'>
        <Detail
          label='Bérlési díj'
          value={
            booking?.payload?.pricing?.rentalFee
              ? `${booking.payload.pricing.rentalFee} €`
              : null
          }
        />
        <Detail
          label='Biztosítás'
          value={
            booking?.payload?.pricing?.insurance
              ? `${booking.payload.pricing.insurance} €`
              : 'Nem kértek'
          }
        />
        <Detail
          label='Kaució'
          value={
            booking?.payload?.pricing?.deposit
              ? `${booking.payload.pricing.deposit} €`
              : '0 €'
          }
        />
        <Detail
          label='Kiszállási díj'
          value={
            booking?.payload?.pricing?.deliveryFee
              ? `${booking.payload.pricing.deliveryFee} €`
              : '0 €'
          }
        />
      </div>
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <Detail
          label='Kiszállítás helye'
          value={
            booking?.payload?.delivery?.locationName ?? 'Nincs kiszállítva'
          }
        />
        <Detail
          label='Kiszállítás címe'
          value={
            booking?.payload?.delivery?.address
              ? `${booking.payload.delivery.address.postalCode} ${booking.payload.delivery.address.city}, ${booking.payload.delivery.address.street} ${booking.payload.delivery.address.doorNumber}`
              : 'Nincs megadva'
          }
        />
      </div>
      <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
        <FloatingSelect
          label='Viszi'
          alwaysFloatLabel
          value={form.take}
          onChange={(e) => {
            const selected = takeOptions.find(
              (opt) => opt.value === e.target.value,
            );
            setForm((prev) => ({
              ...prev,
              take: selected?.value ?? '',
            }));
          }}
        >
          {takeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>

        <Input
          label='Km óra állás'
          value={form.milage}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, milage: e.target.value }))
          }
        />
      </form>
    </div>
  );
}
