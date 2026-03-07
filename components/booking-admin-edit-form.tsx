'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { updateBookingAdminAction } from '@/actions/updateBookingAdminAction';
import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { formatLocale } from '@/lib/format/format-locale';
import { getStatusMeta } from '@/lib/status';

type HandoverDirectionValue = 'out' | 'in';
type HandoverCostTypeValue = 'tip' | 'fuel' | 'ferry' | 'cleaning';

type BookingPricingSnapshotForm = {
  rentalFee: string;
  insurance: string;
  deposit: string;
  deliveryFee: string;
  extrasFee: string;
  tip: string;
};

type BookingDeliveryDetailsForm = {
  placeType: string;
  locationName: string;
  addressLine: string;
  island: string;
  arrivalFlight: string;
  departureFlight: string;
  arrivalHour: string;
  arrivalMinute: string;
};

type BookingHandoverCostForm = {
  direction: HandoverDirectionValue;
  costType: HandoverCostTypeValue;
  amount: string;
};

type VehicleHandoverForm = {
  fleetVehicleId: string;
  direction: HandoverDirectionValue;
  handoverAt: string;
  handoverBy: string;
  mileage: string;
  notes: string;
  damages: string;
  damagesImages: string;
};

type BookingContractForm = {
  signerName: string;
  signerEmail: string;
  contractVersion: string;
  contractText: string;
  signatureData: string;
  lessorSignatureData: string;
  signedAt: string;
  pdfSentAt: string;
};

export type BookingAdminInitialData = {
  id: string;
  createdAt: string;
  updatedAt: string;
  humanId: string;
  locale: string;
  carId: string;
  quoteId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  rentalStart: string;
  rentalEnd: string;
  originalRentalEnd: string;
  maxExtendableRentalEnd: string;
  nextCarBookingCode: string;
  rentalDays: string;
  status: string;
  updatedNote: string;
  payloadJson: string;
  hasPricingSnapshot: boolean;
  pricingSnapshot: BookingPricingSnapshotForm;
  hasDeliveryDetails: boolean;
  deliveryDetails: BookingDeliveryDetailsForm;
  handoverCosts: BookingHandoverCostForm[];
  vehicleHandovers: VehicleHandoverForm[];
  hasBookingContract: boolean;
  bookingContract: BookingContractForm;
};

type BookingAdminEditFormProps = {
  initial: BookingAdminInitialData;
};

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

  const meta = getStatusMeta(form.status);

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
        pricingSnapshotJson: form.hasPricingSnapshot || hasPricingValues
          ? JSON.stringify(form.pricingSnapshot)
          : '',
        deliveryDetailsJson: form.hasDeliveryDetails || hasDeliveryValues
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
          <Input label='Létrehozva' value={form.createdAt} readOnly />

          <Input
            label='Azonosító'
            value={form.humanId}
            onChange={(event) => updateBaseField('humanId', event.target.value)}
          />
          <Input
            label='Nyelv'
            value={formatLocale(form.locale)}
            onChange={(event) => updateBaseField('locale', event.target.value)}
          />
          <Input
            label='Állapot'
            value={meta?.label ?? form.status}
            onChange={(event) => updateBaseField('status', event.target.value)}
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
          <Input
            label='Borravaló'
            value={form.pricingSnapshot.tip}
            onChange={(event) => updatePricingField('tip', event.target.value)}
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
