'use client';

import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';
import { useEffect, useMemo, useState } from 'react';

import { islandOptions, placeTypeOptions } from './constants';

type DeliverySectionProps = {
  formModel: ManualBookingFormModel;
};

export function DeliverySection({ formModel }: DeliverySectionProps) {
  const [isAccommodationStoredInBooking, setIsAccommodationStoredInBooking] =
    useState({ status: false, id: '' });
  const [isAccommodationListOpen, setIsAccommodationListOpen] = useState(false);
  const isAccommodationPickup =
    formModel.form.deliveryPlaceType === 'accommodation';
  const accommodationSearch = formModel.form.deliveryLocationName.trim();
  const filteredAccommodations = useMemo(() => {
    if (!isAccommodationPickup) return [];

    const normalizedSearch = accommodationSearch.toLowerCase();
    return formModel.accommodationOptions
      .filter((accommodation) => {
        if (!normalizedSearch) return true;
        return [
          accommodation.name,
          accommodation.city,
          accommodation.street,
          accommodation.houseNumber,
          accommodation.island,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .slice(0, 8);
  }, [
    accommodationSearch,
    formModel.accommodationOptions,
    isAccommodationPickup,
  ]);

  const handlePlaceTypeChange = (value: string) => {
    formModel.updateField('deliveryPlaceType', value);
    if (value !== 'accommodation') {
      formModel.updateField('deliveryAccommodationId', '');
      setIsAccommodationListOpen(false);
    }
  };

  const handleAccommodationNameChange = (value: string) => {
    formModel.updateField('deliveryLocationName', value);
    formModel.updateField('deliveryAccommodationId', '');

    setIsAccommodationListOpen(isAccommodationPickup);
  };

  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Átvétel</h2>
      <div className='grid gap-4 md:grid-cols-5'>
        <FloatingSelect
          label='Átvétel helye'
          value={formModel.form.deliveryPlaceType}
          onChange={(event) => handlePlaceTypeChange(event.target.value)}
        >
          {placeTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
        <div className='relative'>
          <Input
            label='Helyszín neve'
            value={formModel.form.deliveryLocationName}
            onFocus={() => setIsAccommodationListOpen(isAccommodationPickup)}
            onBlur={() => {
              window.setTimeout(() => setIsAccommodationListOpen(false), 120);
            }}
            onChange={(event) => {
              handleAccommodationNameChange(event.target.value);
            }}
            autoComplete='off'
          />
          {isAccommodationPickup &&
            isAccommodationListOpen &&
            filteredAccommodations.length > 0 && (
              <div className='absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border bg-background shadow-lg'>
                {filteredAccommodations.map((accommodation) => (
                  <button
                    key={accommodation.id}
                    type='button'
                    className='block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground'
                    onMouseDown={(event) => {
                      event.preventDefault();
                      formModel.applyAccommodation(accommodation);
                      setIsAccommodationListOpen(false);
                      setIsAccommodationStoredInBooking({
                        status: true,
                        id: accommodation.id,
                      });
                    }}
                  >
                    <span className='block font-medium'>
                      {accommodation.name}
                    </span>
                    <span className='block text-xs text-muted-foreground'>
                      {[
                        accommodation.postalCode,
                        accommodation.city,
                        accommodation.street,
                        accommodation.houseNumber,
                        accommodation.island,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>
        <FloatingSelect
          label='Sziget'
          value={formModel.form.deliveryIsland}
          onChange={(event) =>
            formModel.updateField('deliveryIsland', event.target.value)
          }
        >
          {islandOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FloatingSelect>
        <Input
          label='Érkező járat'
          value={formModel.form.arrivalFlight}
          onChange={(event) =>
            formModel.updateField('arrivalFlight', event.target.value)
          }
        />
        <Input
          label='Távozó járat'
          value={formModel.form.departureFlight}
          onChange={(event) =>
            formModel.updateField('departureFlight', event.target.value)
          }
        />
        <Input
          label='Érkezés órája (00-23)'
          value={formModel.form.arrivalHour}
          onChange={(event) =>
            formModel.updateField('arrivalHour', event.target.value)
          }
        />
        <Input
          label='Érkezés perce (00-59)'
          value={formModel.form.arrivalMinute}
          onChange={(event) =>
            formModel.updateField('arrivalMinute', event.target.value)
          }
        />
        <Input
          label='Átvételi ország'
          value={formModel.form.deliveryCountry}
          onChange={(event) =>
            formModel.updateField('deliveryCountry', event.target.value)
          }
        />
        <Input
          label='Átvételi irányítószám'
          value={formModel.form.deliveryPostalCode}
          onChange={(event) =>
            formModel.updateField('deliveryPostalCode', event.target.value)
          }
        />
        <Input
          label='Átvételi város'
          value={formModel.form.deliveryCity}
          onChange={(event) =>
            formModel.updateField('deliveryCity', event.target.value)
          }
        />
        <Input
          label='Átvételi utca'
          value={formModel.form.deliveryStreet}
          onChange={(event) =>
            formModel.updateField('deliveryStreet', event.target.value)
          }
        />
        <Input
          label='Átvételi közterület jellege'
          value={formModel.form.deliveryStreetType}
          onChange={(event) =>
            formModel.updateField('deliveryStreetType', event.target.value)
          }
        />
        <Input
          label='Átvételi házszám / ajtó'
          value={formModel.form.deliveryDoorNumber}
          onChange={(event) =>
            formModel.updateField('deliveryDoorNumber', event.target.value)
          }
        />
      </div>
    </div>
  );
}
