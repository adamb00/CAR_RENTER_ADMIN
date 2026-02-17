'use client';
import React, { useMemo, useState, useTransition } from 'react';
import { FloatingSelect } from './ui/floating-select';
import { Input } from './ui/input';
import { FloatingTextarea } from './ui/textarea';

import { Booking } from '@/data-service/bookings';
import { FleetVehicle } from '@prisma/client';
import CarDamages from './car-damages';
import { Detail } from './ui/detail';
import { Button } from './ui/button';
import { createVehicleHandoverAction } from '@/actions/createVehicleHandoverAction';
import {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
} from '@/lib/fleet-places';

const emptyForm = {
  take: '',
  date: '',
  time: '',
  milage: '',
  location: DEFAULT_FLEET_PLACE,
  notes: '',
  damages: '',
  damagesImages: [] as string[],
};

const takeOptions = [
  { value: 'John Doe', label: 'John Doe' },
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'Alice Johnson', label: 'Alice Johnson' },
];

const formatArrivalTime = (hour?: string | null, minute?: string | null) => {
  const hourText = hour?.trim() ?? '';
  const minuteText = minute?.trim() ?? '';
  if (!hourText && !minuteText) return 'Nincs megadva';

  const normalizedHour =
    hourText.length > 0 && /^\d+$/.test(hourText)
      ? hourText.padStart(2, '0')
      : hourText || '--';
  const normalizedMinute =
    minuteText.length > 0 && /^\d+$/.test(minuteText)
      ? minuteText.padStart(2, '0')
      : minuteText || '--';

  return `${normalizedHour}:${normalizedMinute}`;
};

type CaroutFormProps = {
  booking: Booking | null;
  vehicle: FleetVehicle | null;
};

type CaroutFormValues = typeof emptyForm;
export default function CaroutForm({ booking, vehicle }: CaroutFormProps) {
  console.log(booking);

  const normalizedInitialValues = useMemo(() => emptyForm, []);
  const [form, setForm] = useState<CaroutFormValues>(normalizedInitialValues);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (!vehicle?.odometer) return;
    setForm((prev) => {
      if (prev.milage.trim().length > 0) return prev;
      return { ...prev, milage: vehicle.odometer.toString() };
    });
  }, [vehicle?.odometer]);

  React.useEffect(() => {
    if (!vehicle?.damages) return;
    setForm((prev) => {
      if (prev.damages.trim().length > 0) return prev;
      return { ...prev, damages: vehicle.damages ?? '' };
    });
  }, [vehicle?.damages]);

  React.useEffect(() => {
    if (!vehicle?.location) return;
    setForm((prev) => {
      if (prev.location.trim().length > 0 && prev.location !== DEFAULT_FLEET_PLACE)
        return prev;
      return { ...prev, location: getFleetPlaceLabel(vehicle.location) };
    });
  }, [vehicle?.location]);

  React.useEffect(() => {
    const rentalStart = booking?.rentalStart;
    if (!rentalStart) return;
    setForm((prev) => {
      if (prev.date.trim().length > 0) return prev;
      return { ...prev, date: rentalStart };
    });
  }, [booking?.rentalStart]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const bookingId = booking?.id;
    const fleetVehicleId =
      booking?.assignedFleetVehicleId ??
      booking?.payload?.assignedFleetVehicleId;

    if (!bookingId) {
      setStatus({
        type: 'error',
        message: 'Hiányzik a foglalás azonosítója.',
      });
      return;
    }

    if (!fleetVehicleId) {
      setStatus({
        type: 'error',
        message: 'Hiányzik a flottajármű azonosítója.',
      });
      return;
    }

    if (!form.take.trim()) {
      setStatus({
        type: 'error',
        message: 'Kérlek válaszd ki, ki viszi az autót.',
      });
      return;
    }

    if (!form.date.trim() || !form.time.trim()) {
      setStatus({
        type: 'error',
        message: 'Kérlek add meg az átadás dátumát és időpontját.',
      });
      return;
    }

    const mileageValue =
      form.milage.trim().length > 0 ? Number(form.milage) : undefined;
    const dateValue = form.date.trim();
    const timeValue = form.time.trim();
    const handoverAt = new Date(`${dateValue}T${timeValue}`).toISOString();

    startTransition(async () => {
      const result = await createVehicleHandoverAction({
        bookingId,
        fleetVehicleId,
        handoverBy: form.take || undefined,
        mileage: mileageValue,
        handoverAt,
        notes: form.notes.trim() || undefined,
        damages: form.damages.trim() || undefined,
        damagesImages: form.damagesImages,
        location: getFleetPlaceValue(form.location),
        direction: 'out',
      });

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Kiadás rögzítve.',
      });
    });
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
      <div className='grid gap-4 mb-6 md:grid-cols-3'>
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
        <Detail
          label='Érkezés ideje'
          value={formatArrivalTime(
            booking?.payload?.delivery?.arrivalHour,
            booking?.payload?.delivery?.arrivalMinute,
          )}
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
          required
        >
          <option value='' disabled>
            Kérlek válassz ki valakit!
          </option>
          {takeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>

        <Input
          label='Dátum'
          type='date'
          value={form.date}
          required
          onChange={(e) =>
            setForm((prev) => ({ ...prev, date: e.target.value }))
          }
        />
        <Input
          label='Időpont'
          type='time'
          value={form.time}
          required
          onChange={(e) =>
            setForm((prev) => ({ ...prev, time: e.target.value }))
          }
        />
        <FloatingSelect
          label='Autó helyszíne'
          alwaysFloatLabel
          value={form.location}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, location: e.target.value }))
          }
        >
          {FLEET_PLACES.map((option) => (
            <option key={option.value} value={option.label}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
        <Input
          label='Km óra állás'
          value={vehicle?.odometer ?? form.milage}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, milage: e.target.value }))
          }
        />
        <div className='md:col-span-2'>
          <FloatingTextarea
            label='Megjegyzések'
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
        <div className='md:col-span-2'>
          <FloatingTextarea
            label='Ismert sérülések'
            value={form.damages}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, damages: e.target.value }))
            }
          />
        </div>
        <div className='md:col-span-2'>
          <CarDamages
            carId={booking?.carId ?? ''}
            vehicleId={booking?.assignedFleetVehicleId ?? ''}
            initialImages={form.damagesImages}
            onImagesChange={(images) =>
              setForm((prev) => ({ ...prev, damagesImages: images }))
            }
          />
        </div>
        <div className='md:col-span-2 flex items-center justify-end gap-3'>
          {status && (
            <p
              className={
                status.type === 'success'
                  ? 'text-sm text-emerald-700'
                  : 'text-sm text-destructive'
              }
            >
              {status.message}
            </p>
          )}
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Mentés...' : 'Kiadás rögzítése'}
          </Button>
        </div>
      </form>
    </div>
  );
}
