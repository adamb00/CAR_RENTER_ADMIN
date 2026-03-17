'use client';

import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';

import { islandOptions, placeTypeOptions } from './constants';

type DeliverySectionProps = {
  formModel: ManualBookingFormModel;
};

export function DeliverySection({ formModel }: DeliverySectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <h2 className='text-base font-semibold'>Átvétel</h2>
      <div className='grid gap-4 md:grid-cols-2'>
        <FloatingSelect
          label='Átvétel helye'
          value={formModel.form.deliveryPlaceType}
          onChange={(event) =>
            formModel.updateField('deliveryPlaceType', event.target.value)
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
          value={formModel.form.deliveryLocationName}
          onChange={(event) =>
            formModel.updateField('deliveryLocationName', event.target.value)
          }
        />
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
