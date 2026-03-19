'use client';
import React, { useMemo, useState, useTransition } from 'react';
import { FloatingSelect } from './ui/floating-select';
import { Input } from './ui/input';
import { FloatingTextarea } from './ui/textarea';

import { createVehicleHandoverAction } from '@/actions/createVehicleHandoverAction';
import { Booking } from '@/data-service/bookings';
import { TAKE_OPTIONS } from '@/lib/constants';
import { formatAddress } from '@/lib/format/format-address';
import { FleetVehicle } from '@prisma/client';
import CarDamages from './car/car-damages';
import { Button } from './ui/button';
import { Detail } from './ui/detail';

const emptyForm = {
  take: '',
  date: '',
  time: '',
  milage: '',
  rangeKm: '',
  fuelCost: '',
  ferryCost: '',
  cleaningCost: '',
  returnLocation: '',
  returnAddress: '',
  sameAsDelivery: false,
  notes: '',
  damages: '',
  damagesImages: [] as string[],
};

type CarinFormProps = {
  booking: Booking | null;
  vehicle: FleetVehicle | null;
  handoverOutMileage?: number | null;
};

type CarinFormValues = typeof emptyForm;
export default function CarinForm({
  booking,
  vehicle,
  handoverOutMileage,
}: CarinFormProps) {
  const normalizedInitialValues = useMemo(() => emptyForm, []);
  const [form, setForm] = useState<CarinFormValues>(normalizedInitialValues);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const minimumMileage =
    handoverOutMileage != null && vehicle?.odometer != null
      ? Math.max(handoverOutMileage, vehicle.odometer)
      : (handoverOutMileage ?? vehicle?.odometer ?? 0);

  const deliveryLocation = booking?.delivery?.locationName ?? '';
  const deliveryAddressRaw = booking?.delivery?.address
    ? formatAddress(booking.delivery.address)
    : '';
  const deliveryAddress = deliveryAddressRaw === '—' ? '' : deliveryAddressRaw;
  const hasDeliveryDetails = Boolean(deliveryLocation || deliveryAddress);

  React.useEffect(() => {
    if (!hasDeliveryDetails) return;
    setForm((prev) => {
      if (
        prev.sameAsDelivery ||
        prev.returnLocation.trim().length > 0 ||
        prev.returnAddress.trim().length > 0
      )
        return prev;
      return {
        ...prev,
        sameAsDelivery: true,
        returnLocation: deliveryLocation,
        returnAddress: deliveryAddress,
      };
    });
  }, [hasDeliveryDetails, deliveryAddress, deliveryLocation]);

  React.useEffect(() => {
    if (!vehicle?.damages) return;
    setForm((prev) => {
      if (prev.damages.trim().length > 0) return prev;
      return { ...prev, damages: vehicle.damages ?? '' };
    });
  }, [vehicle?.damages]);

  React.useEffect(() => {
    const rentalEnd = booking?.rentalEnd;
    if (!rentalEnd) return;
    setForm((prev) => {
      if (prev.date.trim().length > 0) return prev;
      return { ...prev, date: rentalEnd };
    });
  }, [booking?.rentalEnd]);

  React.useEffect(() => {
    if (minimumMileage == null) return;
    setForm((prev) => {
      if (prev.milage.trim().length > 0) return prev;
      return { ...prev, milage: String(minimumMileage) };
    });
  }, [minimumMileage]);

  React.useEffect(() => {
    const inCosts = booking?.payload?.handoverCosts?.in;
    if (!inCosts) return;
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
        fuelCost: inCosts.fuelCost ?? '',
        ferryCost: inCosts.ferryCost ?? '',
        cleaningCost: inCosts.cleaningCost ?? '',
      };
    });
  }, [booking?.payload?.handoverCosts?.in]);

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
        message: 'Kérlek válaszd ki, ki veszi vissza az autót.',
      });
      return;
    }

    if (!form.date.trim() || !form.time.trim()) {
      setStatus({
        type: 'error',
        message: 'Kérlek add meg a visszavétel dátumát és időpontját.',
      });
      return;
    }

    if (!form.milage.trim()) {
      setStatus({
        type: 'error',
        message: 'Kérlek add meg a km óra állást.',
      });
      return;
    }

    const mileageValue =
      form.milage.trim().length > 0 ? Number(form.milage) : undefined;
    if (mileageValue == null || Number.isNaN(mileageValue)) {
      setStatus({
        type: 'error',
        message: 'A km óra állás nem érvényes.',
      });
      return;
    }
    if (!Number.isInteger(mileageValue)) {
      setStatus({
        type: 'error',
        message: 'A km óra állás csak egész szám lehet.',
      });
      return;
    }
    if (mileageValue < minimumMileage) {
      setStatus({
        type: 'error',
        message: `A km óra állás nem lehet kisebb, mint az utolsó rögzített érték (${minimumMileage} km).`,
      });
      return;
    }

    const rangeKmRaw = form.rangeKm.trim();
    const rangeKmValue = rangeKmRaw.length > 0 ? Number(rangeKmRaw) : undefined;
    if (rangeKmValue != null && Number.isNaN(rangeKmValue)) {
      setStatus({
        type: 'error',
        message: 'A hatótáv nem érvényes.',
      });
      return;
    }
    if (rangeKmValue != null && !Number.isInteger(rangeKmValue)) {
      setStatus({
        type: 'error',
        message: 'A hatótáv csak egész km lehet.',
      });
      return;
    }
    if (rangeKmValue != null && rangeKmValue < 0) {
      setStatus({
        type: 'error',
        message: 'A hatótáv nem lehet negatív.',
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

    const returnNotes = [
      form.returnLocation.trim().length > 0
        ? `Visszavétel helye: ${form.returnLocation.trim()}`
        : null,
      form.returnAddress.trim().length > 0
        ? `Visszavétel címe: ${form.returnAddress.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
    const notesValue = [form.notes.trim(), returnNotes]
      .filter((entry) => entry && entry.length > 0)
      .join('\n');

    const dateValue = form.date.trim();
    const timeValue = form.time.trim();
    const handoverAt = new Date(`${dateValue}T${timeValue}`).toISOString();

    startTransition(async () => {
      const result = await createVehicleHandoverAction({
        bookingId,
        fleetVehicleId,
        handoverBy: form.take || undefined,
        mileage: mileageValue,
        rangeKm: rangeKmValue,
        fuelCost: fuelCostValue,
        ferryCost: ferryCostValue,
        cleaningCost: cleaningCostValue,
        handoverAt,
        notes: notesValue || undefined,
        damages: form.damages.trim() || undefined,
        damagesImages: form.damagesImages,
        direction: 'in',
      });

      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setStatus({
        type: 'success',
        message: result?.success ?? 'Visszavétel rögzítve.',
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
            booking?.pricing?.rentalFee
              ? `${booking.pricing.rentalFee} €`
              : null
          }
        />
        <Detail
          label='Biztosítás'
          value={
            booking?.pricing?.insurance
              ? `${booking.pricing.insurance} €`
              : 'Nem kértek'
          }
        />
        <Detail
          label='Kaució'
          value={
            booking?.pricing?.deposit ? `${booking.pricing.deposit} €` : '0 €'
          }
        />
        <Detail
          label='Kiszállási díj'
          value={
            booking?.pricing?.deliveryFee
              ? `${booking.pricing.deliveryFee} €`
              : '0 €'
          }
        />
      </div>
      <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
        <div className='md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground'>
          <input
            id='return-same-as-delivery'
            type='checkbox'
            className='h-4 w-4 rounded border border-input'
            checked={form.sameAsDelivery}
            onChange={(event) => {
              const checked = event.target.checked;
              setForm((prev) => ({
                ...prev,
                sameAsDelivery: checked,
                returnLocation: checked ? deliveryLocation : '',
                returnAddress: checked ? deliveryAddress : '',
              }));
            }}
            disabled={!hasDeliveryDetails}
          />
          <label htmlFor='return-same-as-delivery'>
            Visszavétel helye megegyezik a kiadás címével
          </label>
        </div>
        <Input
          label='Visszavétel helye'
          value={form.returnLocation}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, returnLocation: e.target.value }))
          }
          disabled={form.sameAsDelivery}
        />
        <Input
          label='Visszavétel címe'
          value={form.returnAddress}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, returnAddress: e.target.value }))
          }
          disabled={form.sameAsDelivery}
        />
        <FloatingSelect
          label='Visszaveszi'
          alwaysFloatLabel
          value={form.take}
          onChange={(e) => {
            const selected = TAKE_OPTIONS.find(
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
          {TAKE_OPTIONS.map((option) => (
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
        <div className='space-y-1'>
          <Input
            label='Km óra állás'
            type='number'
            min={minimumMileage}
            required
            value={form.milage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, milage: e.target.value }))
            }
          />
          {minimumMileage > 0 && (
            <p className='text-xs text-muted-foreground'>
              Utolsó rögzített km óra állás: {minimumMileage} km
            </p>
          )}
        </div>
        <Input
          label='Hatótáv (km, opcionális)'
          type='number'
          min={0}
          step={1}
          value={form.rangeKm}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, rangeKm: e.target.value }))
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
        {/* <Input
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
        /> */}
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
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Mentés...' : 'Visszavétel rögzítése'}
          </Button>
        </div>
      </form>
    </div>
  );
}
