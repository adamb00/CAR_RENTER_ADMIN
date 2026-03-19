'use client';

import { createManualBookingAction } from '@/actions/createManualBookingAction';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useState, useTransition } from 'react';

import type {
  CarOption,
  ChildDraft,
  DriverDraft,
  FormState,
  ManualBookingFormMessage,
  ManualBookingFormProps,
  RenterOption,
  TriState,
  ValidationField,
} from '@/components/manual-booking-form/types';
import {
  buildInitialManualBookingForm,
  buildManualBookingPayload,
  buildNameFromDriver,
  createEmptyChild,
  createEmptyDriver,
  getValidationFieldFromError,
  mapRenterPrimaryDriverToDraft,
  splitNameForDriver,
} from '@/components/manual-booking-form/utils';

export function useManualBookingForm({
  fleetOptions,
  carOptions,
  renters,
  initialValues,
  lockFleetVehicle = false,
}: ManualBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<ManualBookingFormMessage | null>(null);
  const [invalidFields, setInvalidFields] = useState<ValidationField[]>([]);
  const [primaryDriverMatchesContact, setPrimaryDriverMatchesContact] =
    useState(false);
  const [contactMatchesPrimaryDriver, setContactMatchesPrimaryDriver] =
    useState(false);
  const [form, setForm] = useState<FormState>(() =>
    buildInitialManualBookingForm(initialValues),
  );

  useEffect(() => {
    if (!primaryDriverMatchesContact) return;

    setForm((previous) => {
      if (previous.drivers.length === 0) return previous;

      const { firstName, lastName } = splitNameForDriver(previous.contactName);
      const firstDriver = previous.drivers[0];
      const nextFirstDriver: DriverDraft = {
        ...firstDriver,
        firstName_1: firstName,
        lastName_1: lastName,
        email: previous.contactEmail,
        phoneNumber: previous.contactPhone,
      };

      if (
        firstDriver.firstName_1 === nextFirstDriver.firstName_1 &&
        firstDriver.lastName_1 === nextFirstDriver.lastName_1 &&
        firstDriver.email === nextFirstDriver.email &&
        firstDriver.phoneNumber === nextFirstDriver.phoneNumber
      ) {
        return previous;
      }

      const nextDrivers = [...previous.drivers];
      nextDrivers[0] = nextFirstDriver;

      return {
        ...previous,
        drivers: nextDrivers,
      };
    });
  }, [primaryDriverMatchesContact, form.contactEmail, form.contactName, form.contactPhone]);

  useEffect(() => {
    if (!contactMatchesPrimaryDriver) return;

    setForm((previous) => {
      const primaryDriver = previous.drivers[0];
      if (!primaryDriver) return previous;

      const primaryDriverName = buildNameFromDriver(primaryDriver);
      const next = {
        ...previous,
        contactName: primaryDriverName,
        contactEmail: primaryDriver.email,
        contactPhone: primaryDriver.phoneNumber,
        invoiceName: primaryDriverName,
        invoiceEmail: primaryDriver.email,
        invoicePhoneNumber: primaryDriver.phoneNumber,
        invoiceCountry: primaryDriver.locationCountry,
        invoicePostalCode: primaryDriver.locationPostalCode,
        invoiceCity: primaryDriver.locationCity,
        invoiceStreet: primaryDriver.locationStreet,
        invoiceStreetType: primaryDriver.locationStreetType,
        invoiceDoorNumber: primaryDriver.locationDoorNumber,
      };

      if (
        previous.contactName === next.contactName &&
        previous.contactEmail === next.contactEmail &&
        previous.contactPhone === next.contactPhone &&
        previous.invoiceName === next.invoiceName &&
        previous.invoiceEmail === next.invoiceEmail &&
        previous.invoicePhoneNumber === next.invoicePhoneNumber &&
        previous.invoiceCountry === next.invoiceCountry &&
        previous.invoicePostalCode === next.invoicePostalCode &&
        previous.invoiceCity === next.invoiceCity &&
        previous.invoiceStreet === next.invoiceStreet &&
        previous.invoiceStreetType === next.invoiceStreetType &&
        previous.invoiceDoorNumber === next.invoiceDoorNumber
      ) {
        return previous;
      }

      return next;
    });
  }, [contactMatchesPrimaryDriver, form.drivers]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (
      key === 'contactName' ||
      key === 'contactEmail' ||
      key === 'contactPhone' ||
      key === 'carId' ||
      key === 'rentalStart' ||
      key === 'rentalEnd'
    ) {
      setInvalidFields((previous) =>
        previous.filter((item) => item !== (key as ValidationField)),
      );
    }
  };

  const applyRenter = (renter: RenterOption) => {
    setForm((previous) => {
      const nextDrivers = [...previous.drivers];
      const primaryDriver = renter.primaryDriver
        ? mapRenterPrimaryDriverToDraft(renter.primaryDriver)
        : null;

      if (primaryDriver) {
        nextDrivers[0] = primaryDriver;
      } else if (nextDrivers.length === 0) {
        nextDrivers.push(createEmptyDriver());
      }

      return {
        ...previous,
        renterId: renter.id,
        contactName: renter.name,
        contactEmail: renter.email ?? '',
        contactPhone: renter.phone ?? '',
        taxId: renter.taxId ?? '',
        taxCompanyName: renter.companyName ?? '',
        paymentMethod: renter.paymentMethod ?? '',
        invoiceName: renter.companyName || renter.name,
        invoiceEmail: renter.email ?? '',
        invoicePhoneNumber: renter.phone ?? '',
        invoiceCountry: primaryDriver?.locationCountry ?? previous.invoiceCountry,
        invoicePostalCode:
          primaryDriver?.locationPostalCode ?? previous.invoicePostalCode,
        invoiceCity: primaryDriver?.locationCity ?? previous.invoiceCity,
        invoiceStreet: primaryDriver?.locationStreet ?? previous.invoiceStreet,
        invoiceStreetType:
          primaryDriver?.locationStreetType ?? previous.invoiceStreetType,
        invoiceDoorNumber:
          primaryDriver?.locationDoorNumber ?? previous.invoiceDoorNumber,
        drivers: nextDrivers,
      };
    });
    setInvalidFields((previous) =>
      previous.filter(
        (item) =>
          item !== 'contactName' &&
          item !== 'contactEmail' &&
          item !== 'contactPhone',
      ),
    );
  };

  const handleContactNameChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      contactName: value,
      renterId: '',
    }));
    setInvalidFields((previous) =>
      previous.filter((item) => item !== 'contactName'),
    );
  };

  const handleFleetVehicleChange = (fleetVehicleId: string) => {
    if (lockFleetVehicle) return;
    const selectedFleet = fleetOptions.find((option) => option.id === fleetVehicleId);
    setForm((previous) => ({
      ...previous,
      fleetVehicleId,
      carId: selectedFleet?.carId ?? previous.carId,
    }));
    setInvalidFields((previous) => previous.filter((item) => item !== 'carId'));
  };

  const handleCarChange = (carId: string) => {
    updateField('carId', carId);
  };

  const updateChild = (index: number, key: keyof ChildDraft, value: string) => {
    setForm((previous) => ({
      ...previous,
      children: previous.children.map((child, childIndex) =>
        childIndex === index ? { ...child, [key]: value } : child,
      ),
    }));
  };

  const updateDriver = (
    index: number,
    key: keyof DriverDraft,
    value: string | TriState,
  ) => {
    setForm((previous) => ({
      ...previous,
      drivers: previous.drivers.map((driver, driverIndex) =>
        driverIndex === index ? { ...driver, [key]: value } : driver,
      ),
    }));
  };

  const addChild = () => {
    setForm((previous) => ({
      ...previous,
      children: [...previous.children, createEmptyChild()],
    }));
  };

  const removeChild = (index: number) => {
    setForm((previous) => ({
      ...previous,
      children:
        previous.children.length === 1
          ? [createEmptyChild()]
          : previous.children.filter((_, childIndex) => childIndex !== index),
    }));
  };

  const addDriver = () => {
    setForm((previous) => ({
      ...previous,
      drivers: [...previous.drivers, createEmptyDriver()],
    }));
  };

  const removeDriver = (index: number) => {
    setForm((previous) => ({
      ...previous,
      drivers:
        previous.drivers.length === 1
          ? [createEmptyDriver()]
          : previous.drivers.filter((_, driverIndex) => driverIndex !== index),
    }));
  };

  const isFieldInvalid = (field: ValidationField) => invalidFields.includes(field);

  const focusField = (formElement: HTMLFormElement, field: ValidationField) => {
    const target = formElement.querySelector<HTMLElement>(`[data-field="${field}"]`);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setInvalidFields([]);
    const formElement = event.currentTarget;

    startTransition(async () => {
      const result = await createManualBookingAction(buildManualBookingPayload(form));

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        const focusTarget = getValidationFieldFromError(result.error);
        if (focusTarget === 'rentalStart') {
          setInvalidFields((previous) => {
            const next = [...previous];
            if (!next.includes('rentalStart')) next.push('rentalStart');
            if (!next.includes('rentalEnd')) next.push('rentalEnd');
            return next;
          });
          requestAnimationFrame(() => focusField(formElement, 'rentalStart'));
          return;
        }
        if (focusTarget) {
          setInvalidFields((previous) =>
            previous.includes(focusTarget)
              ? previous
              : [...previous, focusTarget],
          );
          requestAnimationFrame(() => focusField(formElement, focusTarget));
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

  return {
    form,
    fleetOptions,
    carOptions,
    renters,
    lockFleetVehicle,
    isPending,
    message,
    primaryDriverMatchesContact,
    setPrimaryDriverMatchesContact,
    contactMatchesPrimaryDriver,
    setContactMatchesPrimaryDriver,
    updateField,
    handleContactNameChange,
    applyRenter,
    handleFleetVehicleChange,
    handleCarChange,
    updateChild,
    updateDriver,
    addChild,
    removeChild,
    addDriver,
    removeDriver,
    isFieldInvalid,
    handleSubmit,
  };
}

export type ManualBookingFormModel = ReturnType<typeof useManualBookingForm>;
