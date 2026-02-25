'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { createManualBookingAction } from '@/actions/createManualBookingAction';
import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { FloatingTextarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FleetOption = {
  id: string;
  plate: string;
  carLabel: string;
  carId: string;
};

type CarOption = {
  id: string;
  label: string;
};

type ManualBookingFormProps = {
  fleetOptions: FleetOption[];
  carOptions: CarOption[];
  initialValues?: {
    fleetVehicleId?: string;
    rentalStart?: string;
    rentalEnd?: string;
    carId?: string;
  };
  lockFleetVehicle?: boolean;
};

type TriState = '' | 'true' | 'false';

type ChildDraft = {
  age: string;
  height: string;
};

type DriverDraft = {
  firstName_1: string;
  firstName_2: string;
  lastName_1: string;
  lastName_2: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  locationCountry: string;
  locationPostalCode: string;
  locationCity: string;
  locationStreet: string;
  locationStreetType: string;
  locationDoorNumber: string;
  documentType: string;
  documentNumber: string;
  validFrom: string;
  validUntil: string;
  drivingLicenceNumber: string;
  drivingLicenceCategory: string;
  drivingLicenceValidFrom: string;
  drivingLicenceValidUntil: string;
  drivingLicenceIsOlderThan_3: TriState;
};

type FormState = {
  locale: string;
  status: string;
  quoteIdentifier: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays: string;
  fleetVehicleId: string;
  carId: string;
  carLabel: string;

  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactSame: TriState;

  adults: string;
  extrasText: string;
  children: ChildDraft[];
  drivers: DriverDraft[];

  pricingRentalFee: string;
  pricingInsurance: string;
  pricingDeposit: string;
  pricingDeliveryFee: string;
  pricingDeliveryLocation: string;
  pricingExtrasFee: string;
  pricingTip: string;
  selfServiceEventsJson: string;

  insuranceConsent: TriState;
  privacyConsent: TriState;
  termsConsent: TriState;
  paymentMethod: string;

  invoiceSame: TriState;
  invoiceName: string;
  invoicePhoneNumber: string;
  invoiceEmail: string;
  invoiceCountry: string;
  invoicePostalCode: string;
  invoiceCity: string;
  invoiceStreet: string;
  invoiceStreetType: string;
  invoiceDoorNumber: string;

  taxId: string;
  taxCompanyName: string;

  deliveryPlaceType: string;
  deliveryLocationName: string;
  arrivalFlight: string;
  arrivalHour: string;
  arrivalMinute: string;
  departureFlight: string;
  deliveryCountry: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryStreetType: string;
  deliveryDoorNumber: string;
};

const localeOptions = [
  { value: 'hu', label: 'Magyar' },
  { value: 'en', label: 'Angol' },
  { value: 'de', label: 'Német' },
  { value: 'ro', label: 'Román' },
  { value: 'fr', label: 'Francia' },
  { value: 'es', label: 'Spanyol' },
  { value: 'it', label: 'Olasz' },
  { value: 'sk', label: 'Szlovák' },
  { value: 'cz', label: 'Cseh' },
  { value: 'se', label: 'Svéd' },
  { value: 'no', label: 'Norvég' },
  { value: 'dk', label: 'Dán' },
  { value: 'pl', label: 'Lengyel' },
];

const statusOptions = [
  { value: 'new', label: 'Új' },
  { value: 'form_submitted', label: 'Foglalási űrlap kitöltve' },
  { value: 'accepted', label: 'Elfogadott' },
  { value: 'registered', label: 'Regisztrált' },
  { value: 'cancelled', label: 'Törölt' },
];

const paymentMethodOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'advance_transfer', label: 'Előre utalás' },
  { value: 'cash_on_pickup', label: 'Átvételkor készpénz' },
  { value: 'card_on_pickup', label: 'Átvételkor bankkártya' },
  {
    value: 'instant_transfer_on_pickup',
    label: 'Átvételkor azonnali átutalás',
  },
];

const placeTypeOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'airport', label: 'Átvétel a reptéren' },
  { value: 'accommodation', label: 'Átvétel a szállásnál' },
  { value: 'office', label: 'Átvétel az irodánál' },
];

const documentTypeOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'passport', label: 'Útlevél' },
  { value: 'id_card', label: 'Személyi igazolvány' },
];

const createEmptyChild = (): ChildDraft => ({
  age: '',
  height: '',
});

const createEmptyDriver = (): DriverDraft => ({
  firstName_1: '',
  firstName_2: '',
  lastName_1: '',
  lastName_2: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  placeOfBirth: '',
  locationCountry: '',
  locationPostalCode: '',
  locationCity: '',
  locationStreet: '',
  locationStreetType: '',
  locationDoorNumber: '',
  documentType: '',
  documentNumber: '',
  validFrom: '',
  validUntil: '',
  drivingLicenceNumber: '',
  drivingLicenceCategory: '',
  drivingLicenceValidFrom: '',
  drivingLicenceValidUntil: '',
  drivingLicenceIsOlderThan_3: '',
});

const splitExtras = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

type ValidationField = 'contactName' | 'contactEmail' | 'rentalStart' | 'rentalEnd';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_FIELD_CLASS = 'border-rose-500 focus:border-rose-600 focus:ring-rose-500';

export function ManualBookingForm({
  fleetOptions,
  carOptions,
  initialValues,
  lockFleetVehicle = false,
}: ManualBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [invalidFields, setInvalidFields] = useState<ValidationField[]>([]);

  const [form, setForm] = useState<FormState>({
    locale: 'hu',
    status: 'registered',
    quoteIdentifier: '',
    rentalStart: initialValues?.rentalStart ?? '',
    rentalEnd: initialValues?.rentalEnd ?? '',
    rentalDays: '',
    fleetVehicleId: initialValues?.fleetVehicleId ?? '',
    carId: initialValues?.carId ?? '',
    carLabel: '',

    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactSame: '',

    adults: '',
    extrasText: '',
    children: [createEmptyChild()],
    drivers: [createEmptyDriver()],

    pricingRentalFee: '',
    pricingInsurance: '',
    pricingDeposit: '',
    pricingDeliveryFee: '',
    pricingDeliveryLocation: '',
    pricingExtrasFee: '',
    pricingTip: '',
    selfServiceEventsJson: '',

    insuranceConsent: '',
    privacyConsent: '',
    termsConsent: '',
    paymentMethod: '',

    invoiceSame: '',
    invoiceName: '',
    invoicePhoneNumber: '',
    invoiceEmail: '',
    invoiceCountry: '',
    invoicePostalCode: '',
    invoiceCity: '',
    invoiceStreet: '',
    invoiceStreetType: '',
    invoiceDoorNumber: '',

    taxId: '',
    taxCompanyName: '',

    deliveryPlaceType: '',
    deliveryLocationName: '',
    arrivalFlight: '',
    arrivalHour: '',
    arrivalMinute: '',
    departureFlight: '',
    deliveryCountry: '',
    deliveryPostalCode: '',
    deliveryCity: '',
    deliveryStreet: '',
    deliveryStreetType: '',
    deliveryDoorNumber: '',
  });

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'contactName' ||
      key === 'contactEmail' ||
      key === 'rentalStart' ||
      key === 'rentalEnd'
    ) {
      setInvalidFields((prev) =>
        prev.filter((item) => item !== (key as ValidationField)),
      );
    }
  };

  const handleFleetVehicleChange = (fleetVehicleId: string) => {
    if (lockFleetVehicle) return;
    const selectedFleet = fleetOptions.find(
      (option) => option.id === fleetVehicleId,
    );
    setForm((prev) => ({
      ...prev,
      fleetVehicleId,
      carId: selectedFleet?.carId ?? prev.carId,
    }));
  };

  const updateChild = (index: number, key: keyof ChildDraft, value: string) => {
    setForm((prev) => ({
      ...prev,
      children: prev.children.map((child, idx) =>
        idx === index ? { ...child, [key]: value } : child,
      ),
    }));
  };

  const updateDriver = (
    index: number,
    key: keyof DriverDraft,
    value: string | TriState,
  ) => {
    setForm((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver, idx) =>
        idx === index ? { ...driver, [key]: value } : driver,
      ),
    }));
  };

  const addChild = () => {
    setForm((prev) => ({
      ...prev,
      children: [...prev.children, createEmptyChild()],
    }));
  };

  const removeChild = (index: number) => {
    setForm((prev) => ({
      ...prev,
      children:
        prev.children.length === 1
          ? [createEmptyChild()]
          : prev.children.filter((_, idx) => idx !== index),
    }));
  };

  const addDriver = () => {
    setForm((prev) => ({
      ...prev,
      drivers: [...prev.drivers, createEmptyDriver()],
    }));
  };

  const removeDriver = (index: number) => {
    setForm((prev) => ({
      ...prev,
      drivers:
        prev.drivers.length === 1
          ? [createEmptyDriver()]
          : prev.drivers.filter((_, idx) => idx !== index),
    }));
  };

  const isFieldInvalid = (field: ValidationField) =>
    invalidFields.includes(field);

  const focusField = (
    formElement: HTMLFormElement,
    field: ValidationField,
  ) => {
    const target = formElement.querySelector<HTMLElement>(
      `[data-field="${field}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.focus();
    }
  };

  const validateBeforeSubmit = (values: FormState) => {
    const fields: ValidationField[] = [];

    if (!values.contactName.trim()) fields.push('contactName');

    const email = values.contactEmail.trim();
    if (!email || !EMAIL_PATTERN.test(email)) fields.push('contactEmail');

    if (!values.rentalStart) fields.push('rentalStart');
    if (!values.rentalEnd) fields.push('rentalEnd');

    if (values.rentalStart && values.rentalEnd && values.rentalEnd < values.rentalStart) {
      if (!fields.includes('rentalEnd')) fields.push('rentalEnd');
    }

    let messageText = '';
    if (fields.includes('contactName')) {
      messageText = 'A név megadása kötelező.';
    } else if (fields.includes('contactEmail')) {
      messageText = 'Érvényes e-mail cím megadása kötelező.';
    } else if (
      fields.includes('rentalStart') ||
      fields.includes('rentalEnd')
    ) {
      messageText = 'A kezdő és záró dátum megadása kötelező.';
    }

    return { fields, messageText };
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formElement = event.currentTarget;

    const validation = validateBeforeSubmit(form);
    if (validation.fields.length > 0) {
      setInvalidFields(validation.fields);
      setMessage({
        type: 'error',
        text: validation.messageText || 'Ellenőrizd a hibás mezőket.',
      });
      const firstInvalid = validation.fields[0];
      if (firstInvalid) {
        requestAnimationFrame(() => focusField(formElement, firstInvalid));
      }
      return;
    }
    setInvalidFields([]);

    startTransition(async () => {
      const result = await createManualBookingAction({
        locale: form.locale,
        status: form.status,
        quoteIdentifier: form.quoteIdentifier,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        rentalStart: form.rentalStart,
        rentalEnd: form.rentalEnd,
        rentalDays: form.rentalDays,
        fleetVehicleId: form.fleetVehicleId || null,
        carId: form.carId,
        carLabel: form.carLabel,
        adults: form.adults,
        extras: splitExtras(form.extrasText),
        children: form.children,
        drivers: form.drivers.map((driver) => ({
          firstName_1: driver.firstName_1,
          firstName_2: driver.firstName_2,
          lastName_1: driver.lastName_1,
          lastName_2: driver.lastName_2,
          phoneNumber: driver.phoneNumber,
          email: driver.email,
          dateOfBirth: driver.dateOfBirth,
          placeOfBirth: driver.placeOfBirth,
          location: {
            country: driver.locationCountry,
            postalCode: driver.locationPostalCode,
            city: driver.locationCity,
            street: driver.locationStreet,
            streetType: driver.locationStreetType,
            doorNumber: driver.locationDoorNumber,
          },
          document: {
            type: driver.documentType,
            number: driver.documentNumber,
            validFrom: driver.validFrom,
            validUntil: driver.validUntil,
            drivingLicenceNumber: driver.drivingLicenceNumber,
            drivingLicenceCategory: driver.drivingLicenceCategory,
            drivingLicenceValidFrom: driver.drivingLicenceValidFrom,
            drivingLicenceValidUntil: driver.drivingLicenceValidUntil,
            drivingLicenceIsOlderThan_3: driver.drivingLicenceIsOlderThan_3,
          },
        })),
        contact: {
          same: form.contactSame,
        },
        invoice: {
          same: form.invoiceSame,
          name: form.invoiceName,
          phoneNumber: form.invoicePhoneNumber,
          email: form.invoiceEmail,
          location: {
            country: form.invoiceCountry,
            postalCode: form.invoicePostalCode,
            city: form.invoiceCity,
            street: form.invoiceStreet,
            streetType: form.invoiceStreetType,
            doorNumber: form.invoiceDoorNumber,
          },
        },
        delivery: {
          placeType: form.deliveryPlaceType,
          locationName: form.deliveryLocationName,
          arrivalFlight: form.arrivalFlight,
          departureFlight: form.departureFlight,
          arrivalHour: form.arrivalHour,
          arrivalMinute: form.arrivalMinute,
          address: {
            country: form.deliveryCountry,
            postalCode: form.deliveryPostalCode,
            city: form.deliveryCity,
            street: form.deliveryStreet,
            streetType: form.deliveryStreetType,
            doorNumber: form.deliveryDoorNumber,
          },
        },
        tax: {
          id: form.taxId,
          companyName: form.taxCompanyName,
        },
        consents: {
          privacy: form.privacyConsent,
          terms: form.termsConsent,
          insurance: form.insuranceConsent,
          paymentMethod: form.paymentMethod,
        },
        pricing: {
          rentalFee: form.pricingRentalFee,
          insurance: form.pricingInsurance,
          deposit: form.pricingDeposit,
          deliveryFee: form.pricingDeliveryFee,
          deliveryLocation: form.pricingDeliveryLocation,
          extrasFee: form.pricingExtrasFee,
          tip: form.pricingTip,
        },
        selfServiceEventsJson: form.selfServiceEventsJson,
      });

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        if (result.error.includes('név')) {
          setInvalidFields((prev) =>
            prev.includes('contactName') ? prev : [...prev, 'contactName'],
          );
          requestAnimationFrame(() => focusField(formElement, 'contactName'));
        } else if (result.error.toLowerCase().includes('e-mail')) {
          setInvalidFields((prev) =>
            prev.includes('contactEmail') ? prev : [...prev, 'contactEmail'],
          );
          requestAnimationFrame(() => focusField(formElement, 'contactEmail'));
        } else if (result.error.toLowerCase().includes('záró dátum')) {
          setInvalidFields((prev) =>
            prev.includes('rentalEnd') ? prev : [...prev, 'rentalEnd'],
          );
          requestAnimationFrame(() => focusField(formElement, 'rentalEnd'));
        } else if (result.error.toLowerCase().includes('dátum')) {
          setInvalidFields((prev) => {
            const next = [...prev];
            if (!next.includes('rentalStart')) next.push('rentalStart');
            if (!next.includes('rentalEnd')) next.push('rentalEnd');
            return next;
          });
          requestAnimationFrame(() => focusField(formElement, 'rentalStart'));
        }
        return;
      }

      if (result?.bookingId) {
        router.push(`/${result.bookingId}`);
        return;
      }

      setMessage({
        type: 'success',
        text: result?.success ?? 'Foglalás mentve.',
      });
      router.push('/calendar');
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Foglalási adatok</h2>
        <div className='grid gap-4 md:grid-cols-3'>
          <Input
            label='Név'
            value={form.contactName}
            onChange={(event) => updateField('contactName', event.target.value)}
            required
            data-field='contactName'
            className={cn(isFieldInvalid('contactName') && INVALID_FIELD_CLASS)}
          />
          <Input
            label='E-mail'
            type='email'
            value={form.contactEmail}
            onChange={(event) => updateField('contactEmail', event.target.value)}
            required
            data-field='contactEmail'
            className={cn(isFieldInvalid('contactEmail') && INVALID_FIELD_CLASS)}
          />
          <Input
            label='Telefon'
            value={form.contactPhone}
            onChange={(event) => updateField('contactPhone', event.target.value)}
          />

          <FloatingSelect
            label='Nyelv'
            value={form.locale}
            onChange={(event) => updateField('locale', event.target.value)}
          >
            {localeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            label='Állapot'
            value={form.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect
            label='Flotta autó (opcionális)'
            value={form.fleetVehicleId}
            onChange={(event) => handleFleetVehicleChange(event.target.value)}
            disabled={lockFleetVehicle}
          >
            <option value=''>Nincs kiválasztva</option>
            {fleetOptions.map((fleet) => (
              <option key={fleet.id} value={fleet.id}>
                {fleet.plate} - {fleet.carLabel}
              </option>
            ))}
          </FloatingSelect>

          <Input
            label='Bérelt napok száma (opcionális)'
            type='number'
            min='1'
            step='1'
            value={form.rentalDays}
            onChange={(event) => updateField('rentalDays', event.target.value)}
          />

          <Input
            label='Bérlés kezdete'
            type='date'
            value={form.rentalStart}
            onChange={(event) => updateField('rentalStart', event.target.value)}
            required
            data-field='rentalStart'
            className={cn(isFieldInvalid('rentalStart') && INVALID_FIELD_CLASS)}
          />

          <Input
            label='Bérlés vége'
            type='date'
            value={form.rentalEnd}
            onChange={(event) => updateField('rentalEnd', event.target.value)}
            required
            data-field='rentalEnd'
            className={cn(isFieldInvalid('rentalEnd') && INVALID_FIELD_CLASS)}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Díjak és fizetési adatok</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <Input
            label='Foglalási díj'
            value={form.pricingRentalFee}
            onChange={(event) =>
              updateField('pricingRentalFee', event.target.value)
            }
          />
          <Input
            label='Biztosítás díja'
            value={form.pricingInsurance}
            onChange={(event) =>
              updateField('pricingInsurance', event.target.value)
            }
          />
          <Input
            label='Kaució'
            value={form.pricingDeposit}
            onChange={(event) =>
              updateField('pricingDeposit', event.target.value)
            }
          />
          <Input
            label='Átvétel díja'
            value={form.pricingDeliveryFee}
            onChange={(event) =>
              updateField('pricingDeliveryFee', event.target.value)
            }
          />
          <Input
            label='Extrák díja'
            value={form.pricingExtrasFee}
            onChange={(event) =>
              updateField('pricingExtrasFee', event.target.value)
            }
          />

          <FloatingSelect
            label='Fizetési mód'
            value={form.paymentMethod}
            onChange={(event) =>
              updateField('paymentMethod', event.target.value)
            }
          >
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FloatingSelect>
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Utasok és extrák</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <Input
            label='Felnőttek száma'
            type='number'
            min='0'
            step='1'
            value={form.adults}
            onChange={(event) => updateField('adults', event.target.value)}
          />
        </div>

        <FloatingTextarea
          label='Extrák (soronként vagy vesszővel elválasztva)'
          value={form.extrasText}
          onChange={(event) => updateField('extrasText', event.target.value)}
        />

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>Gyerekek</h3>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addChild}
            >
              Gyerek hozzáadása
            </Button>
          </div>
          {form.children.map((child, index) => (
            <div
              key={index}
              className='grid gap-3 md:grid-cols-3 rounded-md border p-3'
            >
              <Input
                label={`Gyerek ${index + 1} - életkor`}
                type='number'
                min='0'
                step='1'
                value={child.age}
                onChange={(event) =>
                  updateChild(index, 'age', event.target.value)
                }
              />
              <Input
                label={`Gyerek ${index + 1} - magasság (cm)`}
                type='number'
                min='0'
                step='1'
                value={child.height}
                onChange={(event) =>
                  updateChild(index, 'height', event.target.value)
                }
              />
              <div className='flex items-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => removeChild(index)}
                  className='w-full'
                >
                  Törlés
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold'>Sofőrök</h2>
          <Button type='button' variant='outline' size='sm' onClick={addDriver}>
            Sofőr hozzáadása
          </Button>
        </div>

        {form.drivers.map((driver, index) => (
          <div key={index} className='space-y-4 rounded-md border p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold'>Sofőr {index + 1}</h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => removeDriver(index)}
              >
                Törlés
              </Button>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Keresztnév'
                value={driver.firstName_1}
                onChange={(event) =>
                  updateDriver(index, 'firstName_1', event.target.value)
                }
              />
              <Input
                label='Vezetéknév'
                value={driver.lastName_1}
                onChange={(event) =>
                  updateDriver(index, 'lastName_1', event.target.value)
                }
              />
              <Input
                label='Telefon'
                value={driver.phoneNumber}
                onChange={(event) =>
                  updateDriver(index, 'phoneNumber', event.target.value)
                }
              />
              <Input
                label='E-mail'
                type='email'
                value={driver.email}
                onChange={(event) =>
                  updateDriver(index, 'email', event.target.value)
                }
              />
              <Input
                label='Születési dátum'
                type='date'
                value={driver.dateOfBirth}
                onChange={(event) =>
                  updateDriver(index, 'dateOfBirth', event.target.value)
                }
              />
              <Input
                label='Születési hely'
                value={driver.placeOfBirth}
                onChange={(event) =>
                  updateDriver(index, 'placeOfBirth', event.target.value)
                }
              />
            </div>

            <div className='space-y-3'>
              <h4 className='text-sm font-semibold text-muted-foreground'>
                Lakcím
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <Input
                  label='Ország'
                  value={driver.locationCountry}
                  onChange={(event) =>
                    updateDriver(index, 'locationCountry', event.target.value)
                  }
                />
                <Input
                  label='Irányítószám'
                  value={driver.locationPostalCode}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'locationPostalCode',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Város'
                  value={driver.locationCity}
                  onChange={(event) =>
                    updateDriver(index, 'locationCity', event.target.value)
                  }
                />
                <Input
                  label='Utca'
                  value={driver.locationStreet}
                  onChange={(event) =>
                    updateDriver(index, 'locationStreet', event.target.value)
                  }
                />
                <Input
                  label='Közterület jellege'
                  value={driver.locationStreetType}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'locationStreetType',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Házszám / ajtó'
                  value={driver.locationDoorNumber}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'locationDoorNumber',
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className='space-y-3'>
              <h4 className='text-sm font-semibold text-muted-foreground'>
                Személyi okmány
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <FloatingSelect
                  label='Okmány típusa'
                  value={driver.documentType}
                  onChange={(event) =>
                    updateDriver(index, 'documentType', event.target.value)
                  }
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FloatingSelect>
                <Input
                  label='Okmány száma'
                  value={driver.documentNumber}
                  onChange={(event) =>
                    updateDriver(index, 'documentNumber', event.target.value)
                  }
                />
                <Input
                  label='Érvényesség kezdete'
                  type='date'
                  value={driver.validFrom}
                  onChange={(event) =>
                    updateDriver(index, 'validFrom', event.target.value)
                  }
                />
                <Input
                  label='Érvényesség vége'
                  type='date'
                  value={driver.validUntil}
                  onChange={(event) =>
                    updateDriver(index, 'validUntil', event.target.value)
                  }
                />
              </div>
            </div>

            <div className='space-y-3'>
              <h4 className='text-sm font-semibold text-muted-foreground'>
                Jogosítvány
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <Input
                  label='Jogosítvány száma'
                  value={driver.drivingLicenceNumber}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'drivingLicenceNumber',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Kategória'
                  value={driver.drivingLicenceCategory}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'drivingLicenceCategory',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Érvényesség kezdete'
                  type='date'
                  value={driver.drivingLicenceValidFrom}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'drivingLicenceValidFrom',
                      event.target.value,
                    )
                  }
                />
                <Input
                  label='Érvényesség vége'
                  type='date'
                  value={driver.drivingLicenceValidUntil}
                  onChange={(event) =>
                    updateDriver(
                      index,
                      'drivingLicenceValidUntil',
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Kapcsolat / számlázás</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <Input
            label='Számlázási név'
            value={form.invoiceName}
            onChange={(event) => updateField('invoiceName', event.target.value)}
          />

          <Input
            label='Számlázási ország'
            value={form.invoiceCountry}
            onChange={(event) =>
              updateField('invoiceCountry', event.target.value)
            }
          />
          <Input
            label='Számlázási irányítószám'
            value={form.invoicePostalCode}
            onChange={(event) =>
              updateField('invoicePostalCode', event.target.value)
            }
          />
          <Input
            label='Számlázási város'
            value={form.invoiceCity}
            onChange={(event) => updateField('invoiceCity', event.target.value)}
          />
          <Input
            label='Számlázási utca'
            value={form.invoiceStreet}
            onChange={(event) =>
              updateField('invoiceStreet', event.target.value)
            }
          />
          <Input
            label='Számlázási közterület jellege'
            value={form.invoiceStreetType}
            onChange={(event) =>
              updateField('invoiceStreetType', event.target.value)
            }
          />
          <Input
            label='Számlázási házszám / ajtó'
            value={form.invoiceDoorNumber}
            onChange={(event) =>
              updateField('invoiceDoorNumber', event.target.value)
            }
          />

          <Input
            label='Adószám'
            value={form.taxId}
            onChange={(event) => updateField('taxId', event.target.value)}
          />
          <Input
            label='Cégnév'
            value={form.taxCompanyName}
            onChange={(event) =>
              updateField('taxCompanyName', event.target.value)
            }
          />
        </div>
      </div>

      <div className='rounded-lg border p-4 space-y-4'>
        <h2 className='text-base font-semibold'>Átvétel</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <FloatingSelect
            label='Átvétel helye'
            value={form.deliveryPlaceType}
            onChange={(event) =>
              updateField('deliveryPlaceType', event.target.value)
            }
          >
            {placeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FloatingSelect>

          <Input
            label='Helyszín neve'
            value={form.deliveryLocationName}
            onChange={(event) =>
              updateField('deliveryLocationName', event.target.value)
            }
          />

          <Input
            label='Érkező járat'
            value={form.arrivalFlight}
            onChange={(event) =>
              updateField('arrivalFlight', event.target.value)
            }
          />
          <Input
            label='Távozó járat'
            value={form.departureFlight}
            onChange={(event) =>
              updateField('departureFlight', event.target.value)
            }
          />
          <Input
            label='Érkezés órája (00-23)'
            value={form.arrivalHour}
            onChange={(event) => updateField('arrivalHour', event.target.value)}
          />
          <Input
            label='Érkezés perce (00-59)'
            value={form.arrivalMinute}
            onChange={(event) =>
              updateField('arrivalMinute', event.target.value)
            }
          />

          <Input
            label='Átvételi ország'
            value={form.deliveryCountry}
            onChange={(event) =>
              updateField('deliveryCountry', event.target.value)
            }
          />
          <Input
            label='Átvételi irányítószám'
            value={form.deliveryPostalCode}
            onChange={(event) =>
              updateField('deliveryPostalCode', event.target.value)
            }
          />
          <Input
            label='Átvételi város'
            value={form.deliveryCity}
            onChange={(event) =>
              updateField('deliveryCity', event.target.value)
            }
          />
          <Input
            label='Átvételi utca'
            value={form.deliveryStreet}
            onChange={(event) =>
              updateField('deliveryStreet', event.target.value)
            }
          />
          <Input
            label='Átvételi közterület jellege'
            value={form.deliveryStreetType}
            onChange={(event) =>
              updateField('deliveryStreetType', event.target.value)
            }
          />
          <Input
            label='Átvételi házszám / ajtó'
            value={form.deliveryDoorNumber}
            onChange={(event) =>
              updateField('deliveryDoorNumber', event.target.value)
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
          {isPending ? 'Mentés...' : 'Foglalás mentése'}
        </Button>
        <Button type='button' variant='outline' asChild disabled={isPending}>
          <Link href='/calendar'>Mégse</Link>
        </Button>
      </div>
    </form>
  );
}
