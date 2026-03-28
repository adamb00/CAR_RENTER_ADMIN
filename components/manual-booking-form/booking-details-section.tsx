'use client';

import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';

import { INVALID_FIELD_CLASS, localeOptions, statusOptions } from './constants';
import { RenterNameAutocomplete } from './renter-name-autocomplete';

type BookingDetailsSectionProps = {
  formModel: ManualBookingFormModel;
};

export function BookingDetailsSection({
  formModel,
}: BookingDetailsSectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Foglalási adatok</h2>
      <div className='grid gap-4 md:grid-cols-5'>
        <RenterNameAutocomplete
          value={formModel.form.contactName}
          renters={formModel.renters}
          onChange={formModel.handleContactNameChange}
          onSelect={formModel.applyRenter}
          selectedRenterId={formModel.form.renterId}
          invalid={formModel.isFieldInvalid('contactName')}
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='E-mail'
          type='email'
          required
          value={formModel.form.contactEmail}
          onChange={(event) =>
            formModel.updateField('contactEmail', event.target.value)
          }
          data-field='contactEmail'
          className={cn(
            formModel.isFieldInvalid('contactEmail') && INVALID_FIELD_CLASS,
          )}
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <Input
          label='Telefon'
          required
          value={formModel.form.contactPhone}
          onChange={(event) =>
            formModel.updateField('contactPhone', event.target.value)
          }
          data-field='contactPhone'
          className={cn(
            formModel.isFieldInvalid('contactPhone') && INVALID_FIELD_CLASS,
          )}
          disabled={formModel.contactMatchesPrimaryDriver}
        />
        <FloatingSelect
          label='Nyelv'
          value={formModel.form.locale}
          onChange={(event) =>
            formModel.updateField('locale', event.target.value)
          }
        >
          {localeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label='Állapot'
          value={formModel.form.status}
          onChange={(event) =>
            formModel.updateField('status', event.target.value)
          }
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label='Flotta autó (opcionális)'
          value={formModel.form.fleetVehicleId}
          onChange={(event) =>
            formModel.handleFleetVehicleChange(event.target.value)
          }
          disabled={formModel.lockFleetVehicle}
        >
          <option value=''>Nincs kiválasztva</option>
          {formModel.fleetOptions.map((fleet) => (
            <option key={fleet.id} value={fleet.id}>
              {fleet.plate} - {fleet.carLabel}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label='Autó'
          value={formModel.form.carId}
          onChange={(event) => formModel.handleCarChange(event.target.value)}
          data-field='carId'
          disabled={
            formModel.lockFleetVehicle || Boolean(formModel.form.fleetVehicleId)
          }
          className={cn(
            formModel.isFieldInvalid('carId') && INVALID_FIELD_CLASS,
          )}
        >
          <option value=''>Válassz autót</option>
          {formModel.carOptions.map((car) => (
            <option key={car.id} value={car.id}>
              {car.label}
            </option>
          ))}
        </FloatingSelect>
        <Input
          label='Bérelt napok száma (opcionális)'
          type='number'
          min='1'
          step='1'
          value={formModel.form.rentalDays}
          onChange={(event) =>
            formModel.updateField('rentalDays', event.target.value)
          }
        />
        <Input
          label='Bérlés kezdete'
          type='date'
          value={formModel.form.rentalStart}
          onChange={(event) =>
            formModel.updateField('rentalStart', event.target.value)
          }
          data-field='rentalStart'
          className={cn(
            formModel.isFieldInvalid('rentalStart') && INVALID_FIELD_CLASS,
          )}
        />
        <Input
          label='Bérlés vége'
          type='date'
          value={formModel.form.rentalEnd}
          required
          onChange={(event) =>
            formModel.updateField('rentalEnd', event.target.value)
          }
          data-field='rentalEnd'
          className={cn(
            formModel.isFieldInvalid('rentalEnd') && INVALID_FIELD_CLASS,
          )}
        />
      </div>
    </div>
  );
}
