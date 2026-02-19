'use client';
import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
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
  tip: '',
  fuelCost: '',
  ferryCost: '',
  cleaningCost: '',
  location: DEFAULT_FLEET_PLACE,
  notes: '',
  damages: '',
  damagesImages: [] as string[],
};

const takeOptions = [
  { value: 'Kis Róbert', label: 'Kis Róbert' },
  { value: 'Hidas Andrea', label: 'Hidas Andrea' },
  { value: 'Orosz Tamás', label: 'Orosz Tamás' },
  { value: 'Veress Gabriella', label: 'Veress Gabriella' },
  { value: 'Kis Viktória', label: 'Kis Viktória' },
  { value: 'Kis Patrícia', label: 'Kis Patrícia' },
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
  isContractSigned: boolean;
};

type CaroutFormValues = typeof emptyForm;
export default function CaroutForm({
  booking,
  vehicle,
  isContractSigned,
}: CaroutFormProps) {
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
      if (
        prev.location.trim().length > 0 &&
        prev.location !== DEFAULT_FLEET_PLACE
      )
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

  React.useEffect(() => {
    const tipValue =
      booking?.payload?.handoverTip ?? booking?.payload?.pricing?.tip;
    if (!tipValue) return;
    setForm((prev) => {
      if (prev.tip.trim().length > 0) return prev;
      return { ...prev, tip: tipValue };
    });
  }, [booking?.payload?.handoverTip, booking?.payload?.pricing?.tip]);

  React.useEffect(() => {
    const outCosts = booking?.payload?.handoverCosts?.out;
    if (!outCosts) return;
    setForm((prev) => {
      if (
        prev.fuelCost.trim().length > 0 ||
        prev.ferryCost.trim().length > 0 ||
        prev.cleaningCost.trim().length > 0
      ) {
        return prev;
      }
      return {
        ...prev,
        fuelCost: outCosts.fuelCost ?? '',
        ferryCost: outCosts.ferryCost ?? '',
        cleaningCost: outCosts.cleaningCost ?? '',
      };
    });
  }, [booking?.payload?.handoverCosts?.out]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!isContractSigned) {
      setStatus({
        type: 'error',
        message:
          'A kiadás előtt kötelező a bérleti szerződés aláírása a Digitális szerződés oldalon.',
      });
      return;
    }

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
    if (mileageValue != null && Number.isNaN(mileageValue)) {
      setStatus({
        type: 'error',
        message: 'A km óra állás nem érvényes.',
      });
      return;
    }

    const tipRaw = form.tip.trim().replace(',', '.');
    const tipValue = tipRaw.length > 0 ? Number(tipRaw) : undefined;
    if (tipValue != null && (Number.isNaN(tipValue) || tipValue < 0)) {
      setStatus({
        type: 'error',
        message: 'A jatt mezőbe csak nem negatív szám írható.',
      });
      return;
    }
    const fuelCostRaw = form.fuelCost.trim().replace(',', '.');
    const fuelCostValue =
      fuelCostRaw.length > 0 ? Number(fuelCostRaw) : undefined;
    if (
      fuelCostValue != null &&
      (Number.isNaN(fuelCostValue) || fuelCostValue < 0)
    ) {
      setStatus({
        type: 'error',
        message: 'A tankolás mezőbe csak nem negatív szám írható.',
      });
      return;
    }

    const ferryCostRaw = form.ferryCost.trim().replace(',', '.');
    const ferryCostValue =
      ferryCostRaw.length > 0 ? Number(ferryCostRaw) : undefined;
    if (
      ferryCostValue != null &&
      (Number.isNaN(ferryCostValue) || ferryCostValue < 0)
    ) {
      setStatus({
        type: 'error',
        message: 'A komp mezőbe csak nem negatív szám írható.',
      });
      return;
    }

    const cleaningCostRaw = form.cleaningCost.trim().replace(',', '.');
    const cleaningCostValue =
      cleaningCostRaw.length > 0 ? Number(cleaningCostRaw) : undefined;
    if (
      cleaningCostValue != null &&
      (Number.isNaN(cleaningCostValue) || cleaningCostValue < 0)
    ) {
      setStatus({
        type: 'error',
        message: 'A takarítás mezőbe csak nem negatív szám írható.',
      });
      return;
    }

    const dateValue = form.date.trim();
    const timeValue = form.time.trim();
    const handoverAt = new Date(`${dateValue}T${timeValue}`).toISOString();

    startTransition(async () => {
      const result = await createVehicleHandoverAction({
        bookingId,
        fleetVehicleId,
        handoverBy: form.take || undefined,
        mileage: mileageValue,
        tip: tipValue,
        fuelCost: fuelCostValue,
        ferryCost: ferryCostValue,
        cleaningCost: cleaningCostValue,
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
      {!isContractSigned && booking?.id ? (
        <div className='mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
          A kiadás rögzítéséhez előbb alá kell írni a bérleti szerződést.{' '}
          <Link
            className='font-semibold underline underline-offset-2'
            href={`/bookings/${booking.id}/contract`}
          >
            Ugrás a Digitális szerződés oldalra
          </Link>
          .
        </div>
      ) : null}
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
        <div className='md:col-span-2 grid gap-4 md:grid-cols-3'>
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
        </div>
        <div className='md:col-span-2 grid gap-4 md:grid-cols-4'>
          <Input
            label='Jatt (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.tip}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tip: e.target.value }))
            }
          />
          <Input
            label='Tankolás (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.fuelCost}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fuelCost: e.target.value }))
            }
          />
          <Input
            label='Komp (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.ferryCost}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ferryCost: e.target.value }))
            }
          />
          <Input
            label='Takarítás (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.cleaningCost}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cleaningCost: e.target.value }))
            }
          />
        </div>

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
          <Button type='submit' disabled={isPending || !isContractSigned}>
            {isPending ? 'Mentés...' : 'Kiadás rögzítése'}
          </Button>
        </div>
      </form>
    </div>
  );
}
