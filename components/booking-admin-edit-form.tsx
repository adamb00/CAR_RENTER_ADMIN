'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { updateBookingAdminAction } from '@/actions/updateBookingAdminAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingSelect } from '@/components/ui/floating-select';
import { FloatingTextarea } from '@/components/ui/textarea';

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

const NEW_HANDOVER_COST: BookingHandoverCostForm = {
  direction: 'out',
  costType: 'tip',
  amount: '',
};

const NEW_VEHICLE_HANDOVER: VehicleHandoverForm = {
  fleetVehicleId: '',
  direction: 'out',
  handoverAt: '',
  handoverBy: '',
  mileage: '',
  notes: '',
  damages: '',
  damagesImages: '',
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

  const updateContractField = (key: keyof BookingContractForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      bookingContract: { ...prev.bookingContract, [key]: value },
    }));
  };

  const updateHandoverCostField = (
    index: number,
    key: keyof BookingHandoverCostForm,
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.handoverCosts];
      next[index] = { ...next[index], [key]: value } as BookingHandoverCostForm;
      return { ...prev, handoverCosts: next };
    });
  };

  const removeHandoverCost = (index: number) => {
    setForm((prev) => ({
      ...prev,
      handoverCosts: prev.handoverCosts.filter((_, i) => i !== index),
    }));
  };

  const addHandoverCost = () => {
    setForm((prev) => ({
      ...prev,
      handoverCosts: [...prev.handoverCosts, { ...NEW_HANDOVER_COST }],
    }));
  };

  const updateVehicleHandoverField = (
    index: number,
    key: keyof VehicleHandoverForm,
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.vehicleHandovers];
      next[index] = { ...next[index], [key]: value } as VehicleHandoverForm;
      return { ...prev, vehicleHandovers: next };
    });
  };

  const removeVehicleHandover = (index: number) => {
    setForm((prev) => ({
      ...prev,
      vehicleHandovers: prev.vehicleHandovers.filter((_, i) => i !== index),
    }));
  };

  const addVehicleHandover = () => {
    setForm((prev) => ({
      ...prev,
      vehicleHandovers: [...prev.vehicleHandovers, { ...NEW_VEHICLE_HANDOVER }],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

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
        pricingSnapshotJson: form.hasPricingSnapshot
          ? JSON.stringify(form.pricingSnapshot)
          : '',
        deliveryDetailsJson: form.hasDeliveryDetails
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
          <Input label='Azonosító' value={form.id} readOnly />
          <Input label='Létrehozva' value={form.createdAt} readOnly />
          <Input label='Frissítve' value={form.updatedAt} readOnly />
          <Input
            label='Emberi azonosító'
            value={form.humanId}
            onChange={(event) => updateBaseField('humanId', event.target.value)}
          />
          <Input
            label='Nyelvkód'
            value={form.locale}
            onChange={(event) => updateBaseField('locale', event.target.value)}
          />
          <Input
            label='Állapot'
            value={form.status}
            onChange={(event) => updateBaseField('status', event.target.value)}
          />
          <Input
            label='Autó azonosító'
            value={form.carId}
            onChange={(event) => updateBaseField('carId', event.target.value)}
          />
          <Input
            label='Ajánlat azonosító'
            value={form.quoteId}
            onChange={(event) => updateBaseField('quoteId', event.target.value)}
          />
          <Input
            label='Bérleti napok száma'
            value={form.rentalDays}
            onChange={(event) => updateBaseField('rentalDays', event.target.value)}
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
            onChange={(event) => updateBaseField('rentalStart', event.target.value)}
          />
          <Input
            label='Bérlés vége'
            type='date'
            value={form.rentalEnd}
            onChange={(event) => updateBaseField('rentalEnd', event.target.value)}
          />
          <FloatingTextarea
            label='Frissítési megjegyzés'
            value={form.updatedNote}
            onChange={(event) => updateBaseField('updatedNote', event.target.value)}
            className='md:col-span-3 min-h-24'
          />
          <FloatingTextarea
            label='Adatcsomag (JSON)'
            value={form.payloadJson}
            onChange={(event) => updateBaseField('payloadJson', event.target.value)}
            className='md:col-span-3 min-h-64 font-mono text-xs'
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Árazási adatok</h2>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={form.hasPricingSnapshot}
              onChange={(event) =>
                updateBaseField('hasPricingSnapshot', event.target.checked)
              }
            />
            Aktív rekord
          </label>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Bérleti díj'
            value={form.pricingSnapshot.rentalFee}
            onChange={(event) =>
              updatePricingField('rentalFee', event.target.value)
            }
            disabled={!form.hasPricingSnapshot}
          />
          <Input
            label='Biztosítás'
            value={form.pricingSnapshot.insurance}
            onChange={(event) =>
              updatePricingField('insurance', event.target.value)
            }
            disabled={!form.hasPricingSnapshot}
          />
          <Input
            label='Kaució'
            value={form.pricingSnapshot.deposit}
            onChange={(event) => updatePricingField('deposit', event.target.value)}
            disabled={!form.hasPricingSnapshot}
          />
          <Input
            label='Kiszállítási díj'
            value={form.pricingSnapshot.deliveryFee}
            onChange={(event) =>
              updatePricingField('deliveryFee', event.target.value)
            }
            disabled={!form.hasPricingSnapshot}
          />
          <Input
            label='Extra díjak'
            value={form.pricingSnapshot.extrasFee}
            onChange={(event) =>
              updatePricingField('extrasFee', event.target.value)
            }
            disabled={!form.hasPricingSnapshot}
          />
          <Input
            label='Borravaló'
            value={form.pricingSnapshot.tip}
            onChange={(event) => updatePricingField('tip', event.target.value)}
            disabled={!form.hasPricingSnapshot}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Kiszállítási adatok</h2>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={form.hasDeliveryDetails}
              onChange={(event) =>
                updateBaseField('hasDeliveryDetails', event.target.checked)
              }
            />
            Aktív rekord
          </label>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Átadás hely típusa'
            value={form.deliveryDetails.placeType}
            onChange={(event) => updateDeliveryField('placeType', event.target.value)}
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Helyszín neve'
            value={form.deliveryDetails.locationName}
            onChange={(event) =>
              updateDeliveryField('locationName', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Cím'
            value={form.deliveryDetails.addressLine}
            onChange={(event) =>
              updateDeliveryField('addressLine', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Érkező járat'
            value={form.deliveryDetails.arrivalFlight}
            onChange={(event) =>
              updateDeliveryField('arrivalFlight', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Induló járat'
            value={form.deliveryDetails.departureFlight}
            onChange={(event) =>
              updateDeliveryField('departureFlight', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Érkezés órája'
            value={form.deliveryDetails.arrivalHour}
            onChange={(event) =>
              updateDeliveryField('arrivalHour', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
          <Input
            label='Érkezés perce'
            value={form.deliveryDetails.arrivalMinute}
            onChange={(event) =>
              updateDeliveryField('arrivalMinute', event.target.value)
            }
            disabled={!form.hasDeliveryDetails}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Átadás költségek</h2>
          <Button type='button' variant='outline' size='sm' onClick={addHandoverCost}>
            Sor hozzáadása
          </Button>
        </div>
        {form.handoverCosts.length === 0 && (
          <p className='text-sm text-muted-foreground'>Nincs rögzített sor.</p>
        )}
        <div className='space-y-3'>
          {form.handoverCosts.map((row, index) => (
            <div key={index} className='grid gap-3 rounded-md border p-3 md:grid-cols-4'>
              <FloatingSelect
                label='Irány'
                value={row.direction}
                onChange={(event) =>
                  updateHandoverCostField(index, 'direction', event.target.value)
                }
              >
                <option value='out'>Kiadás</option>
                <option value='in'>Visszavétel</option>
              </FloatingSelect>
              <FloatingSelect
                label='Költség típusa'
                value={row.costType}
                onChange={(event) =>
                  updateHandoverCostField(index, 'costType', event.target.value)
                }
              >
                <option value='tip'>Borravaló</option>
                <option value='fuel'>Tankolás</option>
                <option value='ferry'>Komp</option>
                <option value='cleaning'>Takarítás</option>
              </FloatingSelect>
              <Input
                label='Összeg'
                type='number'
                step='0.01'
                value={row.amount}
                onChange={(event) =>
                  updateHandoverCostField(index, 'amount', event.target.value)
                }
              />
              <Button
                type='button'
                variant='destructive'
                onClick={() => removeHandoverCost(index)}
              >
                Törlés
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Jármű átadás-átvétel</h2>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={addVehicleHandover}
          >
            Sor hozzáadása
          </Button>
        </div>
        {form.vehicleHandovers.length === 0 && (
          <p className='text-sm text-muted-foreground'>Nincs rögzített sor.</p>
        )}
        <div className='space-y-3'>
          {form.vehicleHandovers.map((row, index) => (
            <div key={index} className='space-y-3 rounded-md border p-3'>
              <div className='grid gap-3 md:grid-cols-4'>
                <Input
                  label='Flottaautó azonosító'
                  value={row.fleetVehicleId}
                  onChange={(event) =>
                    updateVehicleHandoverField(
                      index,
                      'fleetVehicleId',
                      event.target.value,
                    )
                  }
                />
                <FloatingSelect
                  label='Irány'
                  value={row.direction}
                  onChange={(event) =>
                    updateVehicleHandoverField(
                      index,
                      'direction',
                      event.target.value,
                    )
                  }
                >
                  <option value='out'>Kiadás</option>
                  <option value='in'>Visszavétel</option>
                </FloatingSelect>
                <Input
                  label='Átadás időpontja'
                  type='datetime-local'
                  value={row.handoverAt}
                  onChange={(event) =>
                    updateVehicleHandoverField(
                      index,
                      'handoverAt',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Átadó személy'
                  value={row.handoverBy}
                  onChange={(event) =>
                    updateVehicleHandoverField(
                      index,
                      'handoverBy',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Kilométeróra állás'
                  type='number'
                  value={row.mileage}
                  onChange={(event) =>
                    updateVehicleHandoverField(index, 'mileage', event.target.value)
                  }
                />
              </div>
              <div className='grid gap-3 md:grid-cols-2'>
                <FloatingTextarea
                  label='Megjegyzés'
                  value={row.notes}
                  onChange={(event) =>
                    updateVehicleHandoverField(index, 'notes', event.target.value)
                  }
                  className='min-h-20'
                />
                <FloatingTextarea
                  label='Sérülések'
                  value={row.damages}
                  onChange={(event) =>
                    updateVehicleHandoverField(index, 'damages', event.target.value)
                  }
                  className='min-h-20'
                />
              </div>
              <FloatingTextarea
                label='Sérülésképek (soronként egy URL)'
                value={row.damagesImages}
                onChange={(event) =>
                  updateVehicleHandoverField(
                    index,
                    'damagesImages',
                    event.target.value,
                  )
                }
                className='min-h-20 font-mono text-xs'
              />
              <Button
                type='button'
                variant='destructive'
                onClick={() => removeVehicleHandover(index)}
              >
                Sor törlése
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Szerződés adatok</h2>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={form.hasBookingContract}
              onChange={(event) =>
                updateBaseField('hasBookingContract', event.target.checked)
              }
            />
            Aktív rekord
          </label>
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          <Input
            label='Aláíró neve'
            value={form.bookingContract.signerName}
            onChange={(event) =>
              updateContractField('signerName', event.target.value)
            }
            disabled={!form.hasBookingContract}
          />
          <Input
            label='Aláíró e-mail'
            value={form.bookingContract.signerEmail}
            onChange={(event) =>
              updateContractField('signerEmail', event.target.value)
            }
            disabled={!form.hasBookingContract}
          />
          <Input
            label='Szerződés verzió'
            value={form.bookingContract.contractVersion}
            onChange={(event) =>
              updateContractField('contractVersion', event.target.value)
            }
            disabled={!form.hasBookingContract}
          />
          <Input
            label='Aláírás időpontja'
            type='datetime-local'
            value={form.bookingContract.signedAt}
            onChange={(event) => updateContractField('signedAt', event.target.value)}
            disabled={!form.hasBookingContract}
          />
          <Input
            label='PDF kiküldés időpontja'
            type='datetime-local'
            value={form.bookingContract.pdfSentAt}
            onChange={(event) => updateContractField('pdfSentAt', event.target.value)}
            disabled={!form.hasBookingContract}
          />
          <Input
            label='Bérlő aláírás adata'
            value={form.bookingContract.signatureData}
            onChange={(event) =>
              updateContractField('signatureData', event.target.value)
            }
            disabled={!form.hasBookingContract}
          />
          <Input
            label='Bérbeadó aláírás adata'
            value={form.bookingContract.lessorSignatureData}
            onChange={(event) =>
              updateContractField('lessorSignatureData', event.target.value)
            }
            disabled={!form.hasBookingContract}
          />
          <FloatingTextarea
            label='Szerződés szövege'
            value={form.bookingContract.contractText}
            onChange={(event) =>
              updateContractField('contractText', event.target.value)
            }
            className='md:col-span-2 min-h-32'
            disabled={!form.hasBookingContract}
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
