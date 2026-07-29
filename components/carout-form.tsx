'use client';
import React, { useMemo, useState, useTransition } from 'react';
import type { FleetVehicle, User } from '@prisma/client';
import { FloatingSelect } from './ui/floating-select';
import { Input } from './ui/input';
import { FloatingTextarea } from './ui/textarea';

import type { Booking } from '@/data-service/bookings';
import CarDamages from './car/car-damages';
import { Detail } from './ui/detail';
import { Button } from './ui/button';
import { createVehicleHandoverAction } from '@/actions/createVehicleHandoverAction';
import { saveBookingDeliveryAction } from '@/actions/saveBookingDeliveryAction';
import {
  DEFAULT_FLEET_PLACE,
  FLEET_PLACES,
  getFleetPlaceLabel,
  getFleetPlaceValue,
} from '@/lib/fleet-places';
import { formatAddress } from '@/lib/format/format-address';
import type { PricingBreakdown } from '@/hooks/use-rental-pricing';

const emptyForm = {
  take: '',
  date: '',
  time: '',
  milage: '',
  rangeKm: '',
  tip: '',
  parkingCost: '',
  fuelCost: '',
  ferryCost: '',
  cleaningCost: '',
  commission: '',
  deliveryPlaceType: '',
  deliveryLocationName: '',
  deliveryAddress: '',
  deliveryIsland: '',
  arrivalFlight: '',
  departureFlight: '',
  arrivalHour: '',
  arrivalMinute: '',
  sameAsDelivery: false,
  returnPlaceType: '',
  returnLocationName: '',
  returnAddress: '',
  returnIsland: '',
  returnHour: '',
  returnMinute: '',
  location: DEFAULT_FLEET_PLACE,
  notes: '',
  damages: '',
  damagesImages: [] as string[],
};

type CaroutFormProps = {
  booking: Booking | null;
  pricing?: PricingBreakdown | null;
  vehicle: FleetVehicle | null;
  users: Pick<User, 'id' | 'name'>[];
  handoverOut?: {
    handoverAt: string;
    handoverBy: string | null;
    mileage: number | null;
    rangeKm: number | null;
    notes: string | null;
    damages: string | null;
    damagesImages: string[];
  } | null;
};

type CaroutFormValues = typeof emptyForm;
const toParsedDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (value?: string | null) => {
  const parsed = toParsedDate(value);
  if (!parsed) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (value?: string | null) => {
  const parsed = toParsedDate(value);
  if (!parsed) return '';
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function CaroutForm({
  booking,
  pricing,
  vehicle,
  users,
  handoverOut,
}: CaroutFormProps) {
  const normalizedInitialValues = useMemo(() => emptyForm, []);
  const userOptions = useMemo(
    () =>
      users
        .filter((user): user is Pick<User, 'id' | 'name'> & { name: string } =>
          Boolean(user.name?.trim()),
        )
        .map((user) => ({
          id: user.id,
          value: user.name,
          label: user.name,
        })),
    [users],
  );
  const [form, setForm] = useState<CaroutFormValues>(normalizedInitialValues);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const delivery = booking?.delivery;

  React.useEffect(() => {
    if (!delivery) return;
    const formattedAddress = delivery.address ? formatAddress(delivery.address) : '';
    setForm((prev) => ({
      ...prev,
      deliveryPlaceType: prev.deliveryPlaceType || delivery.placeType || '',
      deliveryLocationName:
        prev.deliveryLocationName || delivery.locationName || '',
      deliveryAddress:
        prev.deliveryAddress || (formattedAddress === '—' ? '' : formattedAddress),
      deliveryIsland: prev.deliveryIsland || delivery.island || '',
      arrivalFlight: prev.arrivalFlight || delivery.arrivalFlight || '',
      departureFlight: prev.departureFlight || delivery.departureFlight || '',
      arrivalHour: prev.arrivalHour || delivery.arrivalHour || '',
      arrivalMinute: prev.arrivalMinute || delivery.arrivalMinute || '',
      sameAsDelivery: prev.sameAsDelivery || Boolean(delivery.same),
      returnPlaceType:
        prev.returnPlaceType || delivery.returnPlaceType || delivery.placeType || '',
      returnLocationName:
        prev.returnLocationName ||
        delivery.returnLocationName ||
        (delivery.same ? delivery.locationName || '' : ''),
      returnAddress:
        prev.returnAddress ||
        (delivery.returnAddress
          ? formatAddress(delivery.returnAddress)
          : '') ||
        (delivery.same ? (formattedAddress === '—' ? '' : formattedAddress) : ''),
      returnIsland:
        prev.returnIsland ||
        delivery.returnIsland ||
        (delivery.same ? delivery.island || '' : ''),
      returnHour: prev.returnHour || delivery.returnHour || '',
      returnMinute: prev.returnMinute || delivery.returnMinute || '',
    }));
  }, [delivery]);

  React.useEffect(() => {
    if (vehicle?.odometer == null) return;
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
    const tipValue = booking?.payload?.handoverTip ?? booking?.pricing?.tip;
    if (!tipValue) return;
    setForm((prev) => {
      if (prev.tip.trim().length > 0) return prev;
      return { ...prev, tip: tipValue };
    });
  }, [booking?.payload?.handoverTip, booking?.pricing?.tip]);

  React.useEffect(() => {
    const outCosts = booking?.payload?.handoverCosts?.out;
    if (!outCosts) return;
    setForm((prev) => {
      if (
        prev.parkingCost.trim().length > 0 ||
        prev.ferryCost.trim().length > 0 ||
        prev.cleaningCost.trim().length > 0 ||
        prev.commission.trim().length > 0
      ) {
        return prev;
      }
      return {
        ...prev,
        parkingCost: outCosts.fuelCost ?? '',
        ferryCost: outCosts.ferryCost ?? '',
        cleaningCost: outCosts.cleaningCost ?? '',
        commission: outCosts.commissionCost ?? '',
      };
    });
  }, [booking?.payload?.handoverCosts?.out]);

  React.useEffect(() => {
    if (!handoverOut) return;

    setForm((prev) => ({
      ...prev,
      take: handoverOut.handoverBy ?? prev.take,
      date: toDateInputValue(handoverOut.handoverAt) || prev.date,
      time: toTimeInputValue(handoverOut.handoverAt) || prev.time,
      milage:
        handoverOut.mileage != null ? String(handoverOut.mileage) : prev.milage,
      rangeKm:
        handoverOut.rangeKm != null
          ? String(handoverOut.rangeKm)
          : prev.rangeKm,
      notes: handoverOut.notes ?? prev.notes,
      damages: handoverOut.damages ?? prev.damages,
      damagesImages:
        handoverOut.damagesImages.length > 0
          ? handoverOut.damagesImages
          : prev.damagesImages,
    }));
  }, [handoverOut]);

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
    if (mileageValue != null && Number.isNaN(mileageValue)) {
      setStatus({
        type: 'error',
        message: 'A km óra állás nem érvényes.',
      });
      return;
    }
    if (mileageValue != null && !Number.isInteger(mileageValue)) {
      setStatus({
        type: 'error',
        message: 'A km óra állás csak egész szám lehet.',
      });
      return;
    }
    if (
      mileageValue != null &&
      vehicle?.odometer != null &&
      mileageValue < vehicle.odometer
    ) {
      setStatus({
        type: 'error',
        message: `A km óra állás nem lehet kisebb, mint az utolsó rögzített érték (${vehicle.odometer} km).`,
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

    const tipRaw = form.tip.trim().replace(',', '.');
    const tipValue = tipRaw.length > 0 ? Number(tipRaw) : undefined;
    if (tipValue != null && (Number.isNaN(tipValue) || tipValue < 0)) {
      setStatus({
        type: 'error',
        message: 'A jatt mezőbe csak nem negatív szám írható.',
      });
      return;
    }
    const parkingCostRaw = form.parkingCost.trim().replace(',', '.');
    const parkingCostValue =
      parkingCostRaw.length > 0 ? Number(parkingCostRaw) : undefined;
    if (
      parkingCostValue != null &&
      (Number.isNaN(parkingCostValue) || parkingCostValue < 0)
    ) {
      setStatus({
        type: 'error',
        message: 'A parkolás mezőbe csak nem negatív szám írható.',
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

    const commissionRaw = form.commission.trim().replace(',', '.');
    const commissionValue =
      commissionRaw.length > 0 ? Number(commissionRaw) : undefined;
    if (
      commissionValue != null &&
      (Number.isNaN(commissionValue) || commissionValue < 0)
    ) {
      setStatus({
        type: 'error',
        message: 'A jutalék mezőbe csak nem negatív szám írható.',
      });
      return;
    }

    const dateValue = form.date.trim();
    const timeValue = form.time.trim();
    const handoverAt = new Date(`${dateValue}T${timeValue}`).toISOString();

    startTransition(async () => {
      const hasDeliveryFormValue = [
        form.deliveryPlaceType,
        form.deliveryLocationName,
        form.deliveryAddress,
        form.deliveryIsland,
        form.arrivalFlight,
        form.departureFlight,
        form.arrivalHour,
        form.arrivalMinute,
        form.returnPlaceType,
        form.returnLocationName,
        form.returnAddress,
        form.returnIsland,
        form.returnHour,
        form.returnMinute,
      ].some((value) => value.trim().length > 0);

      if (hasDeliveryFormValue) {
        const deliveryResult = await saveBookingDeliveryAction({
          bookingId,
          delivery: {
            placeType: form.deliveryPlaceType,
            locationName: form.deliveryLocationName,
            address: form.deliveryAddress,
            island: form.deliveryIsland,
            arrivalFlight: form.arrivalFlight,
            departureFlight: form.departureFlight,
            arrivalHour: form.arrivalHour,
            arrivalMinute: form.arrivalMinute,
            same: form.sameAsDelivery,
            returnPlaceType: form.returnPlaceType,
            returnLocationName: form.returnLocationName,
            returnAddress: form.returnAddress,
            returnIsland: form.returnIsland,
            returnHour: form.returnHour,
            returnMinute: form.returnMinute,
          },
        });

        if (deliveryResult?.error) {
          setStatus({ type: 'error', message: deliveryResult.error });
          return;
        }
      }

      const result = await createVehicleHandoverAction({
        bookingId,
        fleetVehicleId,
        handoverBy: form.take || undefined,
        mileage: mileageValue,
        rangeKm: rangeKmValue,
        tip: tipValue,
        fuelCost: parkingCostValue,
        ferryCost: ferryCostValue,
        cleaningCost: cleaningCostValue,
        commission: commissionValue,
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
      <div className='grid xl:grid-cols-3 w-full gap-4 mb-6'>
        <Detail label='Foglaló neve' value={booking?.contactName} />
        <Detail label='E-mail' value={booking?.contactEmail} />
        <Detail label='Telefonszám' value={booking?.contactPhone} />
      </div>
      <div className='grid md:grid-cols-4 w-full gap-4 mb-6'>
        <Detail
          label='Bérlési díj'
          value={pricing?.rentalFee ? `${pricing.rentalFee} €` : null}
        />
        <Detail
          label='Biztosítás'
          value={pricing?.insurance ? `${pricing.insurance} €` : 'Nem kértek'}
        />
        <Detail
          label='Kaució'
          value={
            pricing?.insurance
              ? '0 €'
              : pricing?.deposit
                ? `${pricing.deposit} €`
                : '0 €'
          }
        />
        <Detail
          label='Kiszállási díj'
          value={pricing?.deliveryFee ? `${pricing.deliveryFee} €` : '0 €'}
        />
      </div>
      <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
        <div className='md:col-span-2 rounded-lg border p-4'>
          <h2 className='mb-4 text-base font-semibold'>Átvételi adatok</h2>
          <div className='grid gap-4 md:grid-cols-4'>
            <FloatingSelect
              label='Átvétel helye'
              alwaysFloatLabel
              value={form.deliveryPlaceType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryPlaceType: e.target.value,
                }))
              }
            >
              <option value=''>Nincs megadva</option>
              <option value='airport'>Reptér</option>
              <option value='accommodation'>Szálloda</option>
              <option value='office'>Iroda</option>
            </FloatingSelect>
            <Input
              label='Helyszín neve'
              value={form.deliveryLocationName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryLocationName: e.target.value,
                }))
              }
            />
            <Input
              label='Cím'
              value={form.deliveryAddress}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryAddress: e.target.value,
                }))
              }
            />
            <FloatingSelect
              label='Sziget'
              alwaysFloatLabel
              value={form.deliveryIsland}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryIsland: e.target.value,
                }))
              }
            >
              <option value=''>Nincs megadva</option>
              <option value='Lanzarote'>Lanzarote</option>
              <option value='Fuerteventura'>Fuerteventura</option>
            </FloatingSelect>
            <Input
              label='Érkező járat'
              value={form.arrivalFlight}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, arrivalFlight: e.target.value }))
              }
            />
            <Input
              label='Távozó járat'
              value={form.departureFlight}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  departureFlight: e.target.value,
                }))
              }
            />
            <Input
              label='Érkezés órája'
              value={form.arrivalHour}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, arrivalHour: e.target.value }))
              }
            />
            <Input
              label='Érkezés perce'
              value={form.arrivalMinute}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, arrivalMinute: e.target.value }))
              }
            />
          </div>
        </div>
        <div className='md:col-span-2 rounded-lg border p-4'>
          <h2 className='mb-4 text-base font-semibold'>Visszavételi adatok</h2>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground md:col-span-4'>
              <input
                id='carout-return-same-as-delivery'
                type='checkbox'
                className='h-4 w-4 rounded border border-input'
                checked={form.sameAsDelivery}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    sameAsDelivery: checked,
                    returnPlaceType: checked ? prev.deliveryPlaceType : '',
                    returnLocationName: checked ? prev.deliveryLocationName : '',
                    returnAddress: checked ? prev.deliveryAddress : '',
                    returnIsland: checked ? prev.deliveryIsland : '',
                  }));
                }}
              />
              <label htmlFor='carout-return-same-as-delivery'>
                Visszavétel helye megegyezik az átvételi címmel
              </label>
            </div>
            <FloatingSelect
              label='Visszavétel helye'
              alwaysFloatLabel
              value={form.returnPlaceType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  returnPlaceType: e.target.value,
                }))
              }
              disabled={form.sameAsDelivery}
            >
              <option value=''>Nincs megadva</option>
              <option value='airport'>Reptér</option>
              <option value='accommodation'>Szálloda</option>
              <option value='office'>Iroda</option>
            </FloatingSelect>
            <Input
              label='Visszavétel helyszín neve'
              value={form.returnLocationName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  returnLocationName: e.target.value,
                }))
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
              label='Visszavétel szigete'
              alwaysFloatLabel
              value={form.returnIsland}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, returnIsland: e.target.value }))
              }
              disabled={form.sameAsDelivery}
            >
              <option value=''>Nincs megadva</option>
              <option value='Lanzarote'>Lanzarote</option>
              <option value='Fuerteventura'>Fuerteventura</option>
            </FloatingSelect>
            <Input
              label='Visszavétel órája'
              value={form.returnHour}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, returnHour: e.target.value }))
              }
            />
            <Input
              label='Visszavétel perce'
              value={form.returnMinute}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, returnMinute: e.target.value }))
              }
            />
          </div>
        </div>
        <FloatingSelect
          label='Viszi'
          alwaysFloatLabel
          value={form.take}
          onChange={(e) => {
            const selected = userOptions.find(
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
          {userOptions.map((option) => (
            <option key={option.id} value={option.value}>
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
        <div className='md:col-span-2 grid gap-4 md:grid-cols-4'>
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
            type='number'
            min={vehicle?.odometer ?? 0}
            value={form.milage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, milage: e.target.value }))
            }
          />
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
        </div>
        {vehicle?.odometer != null && (
          <p className='md:col-span-2 text-xs text-muted-foreground'>
            Utolsó rögzített km óra állás: {vehicle.odometer} km
          </p>
        )}
        <div className='md:col-span-2 grid gap-4 md:grid-cols-5'>
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
            label='Parkolás (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.parkingCost}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, parkingCost: e.target.value }))
            }
          />

          <Input
            label='Jutalék (opcionális)'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={form.commission}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, commission: e.target.value }))
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
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Mentés...' : 'Kiadás rögzítése'}
          </Button>
        </div>
      </form>
    </div>
  );
}
