'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { updateBookingAdminAction } from '@/actions/updateBookingAdminAction';
import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { formatLocale } from '@/lib/format/format-locale';
import {
  BookingAdminEditFormProps,
  BookingAdminInitialData,
  BookingDeliveryDetailsForm,
  BookingPricingSnapshotForm,
  HandoverCostTypeValue,
} from './types';

export function BookingAdminEditForm({ initial }: BookingAdminEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [form, setForm] = useState(initial);

  const updateBaseField = <
    K extends Exclude<
      keyof BookingAdminInitialData,
      | 'pricingSnapshot'
      | 'drivers'
      | 'deliveryDetails'
      | 'handoverCosts'
      | 'vehicleHandovers'
      | 'bookingContract'
    >,
  >(
    key: K,
    value: BookingAdminInitialData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePricingField = (
    key: keyof BookingPricingSnapshotForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      pricingSnapshot: { ...prev.pricingSnapshot, [key]: value },
    }));
  };

  const updateDeliveryField = (
    key: keyof BookingDeliveryDetailsForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      deliveryDetails: { ...prev.deliveryDetails, [key]: value },
    }));
  };

  const getOutHandoverCostValue = (costType: HandoverCostTypeValue) =>
    form.handoverCosts.find(
      (row) => row.direction === 'out' && row.costType === costType,
    )?.amount ?? '';

  const updateOutHandoverCost = (
    costType: HandoverCostTypeValue,
    amount: string,
  ) => {
    setForm((prev) => {
      const filtered = prev.handoverCosts.filter(
        (row) => !(row.direction === 'out' && row.costType === costType),
      );
      if (amount.trim().length === 0) {
        return { ...prev, handoverCosts: filtered };
      }
      return {
        ...prev,
        handoverCosts: [
          ...filtered,
          {
            direction: 'out',
            costType,
            amount,
          },
        ],
      };
    });
  };

  const hasRentalEndUpperLimit = Boolean(
    form.maxExtendableRentalEnd &&
    (!form.originalRentalEnd ||
      form.maxExtendableRentalEnd >= form.originalRentalEnd),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (form.originalRentalEnd && !form.rentalEnd) {
      setMessage({
        type: 'error',
        text: 'A bérlés vége nem törölhető.',
      });
      return;
    }

    if (
      hasRentalEndUpperLimit &&
      form.rentalEnd &&
      form.rentalEnd > form.maxExtendableRentalEnd
    ) {
      setMessage({
        type: 'error',
        text: form.nextCarBookingCode
          ? `A bérlés vége legfeljebb ${form.maxExtendableRentalEnd} lehet (következő foglalás: ${form.nextCarBookingCode}).`
          : `A bérlés vége legfeljebb ${form.maxExtendableRentalEnd} lehet.`,
      });
      return;
    }

    const handoverCostsPayload = form.handoverCosts
      .map((row) => ({
        direction: row.direction,
        costType: row.costType,
        amount: row.amount,
      }))
      .filter((row) => row.amount.trim().length > 0);

    const vehicleHandoversPayload = form.vehicleHandovers
      .map((row) => ({
        fleetVehicleId: row.fleetVehicleId,
        direction: row.direction,
        handoverAt: row.handoverAt,
        handoverBy: row.handoverBy,
        mileage: row.mileage,
        rangeKm: row.rangeKm,
        notes: row.notes,
        damages: row.damages,
        damagesImages: row.damagesImages
          .split('\n')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      }))
      .filter((row) => row.fleetVehicleId.trim().length > 0);

    startTransition(async () => {
      const hasPricingValues = Object.values(form.pricingSnapshot).some(
        (value) => value.trim().length > 0,
      );
      const hasDeliveryValues = Object.values(form.deliveryDetails).some(
        (value) => value.trim().length > 0,
      );

      const result = await updateBookingAdminAction({
        bookingId: form.id,
        humanId: form.humanId,
        locale: form.locale,
        carId: form.carId,
        quoteId: form.quoteId,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        rentalStart: form.rentalStart,
        rentalEnd: form.rentalEnd,
        rentalDays: form.rentalDays,
        status: form.status,
        updatedNote: form.updatedNote,
        payloadJson: form.payloadJson,
        pricingSnapshotJson:
          form.hasPricingSnapshot || hasPricingValues
            ? JSON.stringify(form.pricingSnapshot)
            : '',
        deliveryDetailsJson:
          form.hasDeliveryDetails || hasDeliveryValues
            ? JSON.stringify(form.deliveryDetails)
            : '',
        handoverCostsJson: JSON.stringify(handoverCostsPayload),
        vehicleHandoversJson: JSON.stringify(vehicleHandoversPayload),
        bookingContractJson: form.hasBookingContract
          ? JSON.stringify(form.bookingContract)
          : '',
      });

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      setMessage({
        type: 'success',
        text: result.success ?? 'Mentve.',
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Foglalás adatok</h2>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Nyelv'
            value={formatLocale(form.locale)}
            onChange={(event) => updateBaseField('locale', event.target.value)}
          />

          <Input
            label='Bérleti napok száma'
            value={form.rentalDays}
            onChange={(event) =>
              updateBaseField('rentalDays', event.target.value)
            }
          />
          <Input
            label='Kapcsolattartó neve'
            value={form.contactName}
            onChange={(event) =>
              updateBaseField('contactName', event.target.value)
            }
          />
          <Input
            label='Kapcsolattartó e-mail'
            value={form.contactEmail}
            onChange={(event) =>
              updateBaseField('contactEmail', event.target.value)
            }
          />
          <Input
            label='Kapcsolattartó telefon'
            value={form.contactPhone}
            onChange={(event) =>
              updateBaseField('contactPhone', event.target.value)
            }
          />
          <Input
            label='Bérlés kezdete'
            type='date'
            value={form.rentalStart}
            onChange={(event) =>
              updateBaseField('rentalStart', event.target.value)
            }
          />
          <Input
            label='Bérlés vége'
            type='date'
            value={form.rentalEnd}
            onChange={(event) =>
              updateBaseField('rentalEnd', event.target.value)
            }
            min={form.rentalStart || undefined}
            max={
              hasRentalEndUpperLimit ? form.maxExtendableRentalEnd : undefined
            }
          />
          {form.originalRentalEnd ? (
            <p className='text-xs text-muted-foreground md:col-span-3'>
              Eredeti bérlés vége: {form.originalRentalEnd}. A bérlés vége
              rövidíthető és hosszabbítható.
              {hasRentalEndUpperLimit
                ? ` Legkésőbbi engedett dátum: ${form.maxExtendableRentalEnd}${form.nextCarBookingCode ? ` (következő foglalás: ${form.nextCarBookingCode}).` : '.'}`
                : ''}
            </p>
          ) : null}
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Sofőr adatok </h2>
        </div>
        {form.drivers.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            A payload nem tartalmaz sofőr adatot.
          </p>
        ) : (
          <div className='space-y-4'>
            {form.drivers.map((driver, index) => (
              <div
                key={`${driver.email}-${driver.documentNumber}-${index}`}
                className='rounded-md border p-3 space-y-3'
              >
                <p className='text-sm font-medium'>Sofőr #{index + 1}</p>
                <div className='grid gap-3 md:grid-cols-3'>
                  <Input
                    label='Keresztnév '
                    value={driver.firstName_1}
                    readOnly
                  />

                  <Input
                    label='Vezetéknév'
                    value={driver.lastName_1}
                    readOnly
                  />
                  <Input label='Telefon' value={driver.phoneNumber} readOnly />
                  <Input label='E-mail' value={driver.email} readOnly />
                  <Input
                    label='Születési dátum'
                    value={driver.dateOfBirth}
                    readOnly
                  />
                  <Input
                    label='Születési hely'
                    value={driver.placeOfBirth}
                    readOnly
                  />
                  <Input
                    label='Lakcím ország'
                    value={driver.locationCountry}
                    readOnly
                  />
                  <Input
                    label='Lakcím irányítószám'
                    value={driver.locationPostalCode}
                    readOnly
                  />
                  <Input
                    label='Lakcím város'
                    value={driver.locationCity}
                    readOnly
                  />
                  <Input
                    label='Lakcím utca'
                    value={driver.locationStreet}
                    readOnly
                  />
                  <Input
                    label='Lakcím közterület típusa'
                    value={driver.locationStreetType}
                    readOnly
                  />
                  <Input
                    label='Lakcím házszám / ajtó'
                    value={driver.locationDoorNumber}
                    readOnly
                  />
                  <Input
                    label='Dokumentum típus'
                    value={driver.documentType}
                    readOnly
                  />
                  <Input
                    label='Dokumentum szám'
                    value={driver.documentNumber}
                    readOnly
                  />
                  <Input
                    label='Jogosítvány szám'
                    value={driver.drivingLicenceNumber}
                    readOnly
                  />
                  <Input
                    label='Jogosítvány kategória'
                    value={driver.drivingLicenceCategory}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Árazás</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Bérleti díj'
            value={form.pricingSnapshot.rentalFee}
            onChange={(event) =>
              updatePricingField('rentalFee', event.target.value)
            }
          />
          <Input
            label='Biztosítás'
            value={form.pricingSnapshot.insurance}
            onChange={(event) =>
              updatePricingField('insurance', event.target.value)
            }
          />
          <Input
            label='Kaució'
            value={form.pricingSnapshot.deposit}
            onChange={(event) =>
              updatePricingField('deposit', event.target.value)
            }
          />
          <Input
            label='Kiszállítási díj'
            value={form.pricingSnapshot.deliveryFee}
            onChange={(event) =>
              updatePricingField('deliveryFee', event.target.value)
            }
          />
          <Input
            label='Extra díjak'
            value={form.pricingSnapshot.extrasFee}
            onChange={(event) =>
              updatePricingField('extrasFee', event.target.value)
            }
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Kiadáskori költségek</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-5'>
          <Input
            label='Jatt'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={getOutHandoverCostValue('tip')}
            onChange={(event) =>
              updateOutHandoverCost('tip', event.target.value)
            }
          />
          <Input
            label='Tankolás'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={getOutHandoverCostValue('fuel')}
            onChange={(event) =>
              updateOutHandoverCost('fuel', event.target.value)
            }
          />
          <Input
            label='Komp'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={getOutHandoverCostValue('ferry')}
            onChange={(event) =>
              updateOutHandoverCost('ferry', event.target.value)
            }
          />
          <Input
            label='Takarítás'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={getOutHandoverCostValue('cleaning')}
            onChange={(event) =>
              updateOutHandoverCost('cleaning', event.target.value)
            }
          />
          <Input
            label='Jutalék'
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            value={getOutHandoverCostValue('commission')}
            onChange={(event) =>
              updateOutHandoverCost('commission', event.target.value)
            }
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Kiszállítási adatok</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Átadás hely típusa'
            value={form.deliveryDetails.placeType}
            onChange={(event) =>
              updateDeliveryField('placeType', event.target.value)
            }
          />
          <Input
            label='Helyszín neve'
            value={form.deliveryDetails.locationName}
            onChange={(event) =>
              updateDeliveryField('locationName', event.target.value)
            }
          />
          <Input
            label='Cím'
            value={form.deliveryDetails.addressLine}
            onChange={(event) =>
              updateDeliveryField('addressLine', event.target.value)
            }
          />
          <FloatingSelect
            label='Sziget'
            value={form.deliveryDetails.island}
            onChange={(event) =>
              updateDeliveryField('island', event.target.value)
            }
          >
            <option value=''>Nincs megadva</option>
            <option value='Lanzarote'>Lanzarote</option>
            <option value='Fuerteventura'>Fuerteventura</option>
          </FloatingSelect>
          <Input
            label='Érkező járat'
            value={form.deliveryDetails.arrivalFlight}
            onChange={(event) =>
              updateDeliveryField('arrivalFlight', event.target.value)
            }
          />
          <Input
            label='Induló járat'
            value={form.deliveryDetails.departureFlight}
            onChange={(event) =>
              updateDeliveryField('departureFlight', event.target.value)
            }
          />
          <Input
            label='Érkezés órája'
            value={form.deliveryDetails.arrivalHour}
            onChange={(event) =>
              updateDeliveryField('arrivalHour', event.target.value)
            }
          />
          <Input
            label='Érkezés perce'
            value={form.deliveryDetails.arrivalMinute}
            onChange={(event) =>
              updateDeliveryField('arrivalMinute', event.target.value)
            }
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'error' ? 'text-destructive' : 'text-emerald-600'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className='flex flex-wrap items-center gap-3'>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Mentés...' : 'Minden adat mentése'}
        </Button>
        <Button type='button' variant='outline' asChild disabled={isPending}>
          <Link href={`/${form.id}`}>Vissza a foglaláshoz</Link>
        </Button>
      </div>
    </form>
  );
}
