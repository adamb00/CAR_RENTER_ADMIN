'use client';

import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import type { ManualBookingFormModel } from '@/hooks/use-manual-booking-form';
import { documentTypeOptions } from './constants';
import type { DriverDraft } from './types';

type DriversSectionProps = {
  formModel: ManualBookingFormModel;
};

export function DriversSection({ formModel }: DriversSectionProps) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-semibold'>Sofőrök</h2>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={formModel.addDriver}
        >
          Sofőr hozzáadása
        </Button>
      </div>

      {formModel.form.drivers.map((driver: DriverDraft, index: number) => (
        <div key={index} className='space-y-4 rounded-md border p-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>Sofőr {index + 1}</h3>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => formModel.removeDriver(index)}
            >
              Törlés
            </Button>
          </div>

          {index === 0 ? (
            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <input
                type='checkbox'
                checked={formModel.primaryDriverMatchesContact}
                onChange={(event) =>
                  formModel.setPrimaryDriverMatchesContact(event.target.checked)
                }
              />
              Elsődleges sofőr adatai megegyeznek a fenti név, e-mail és telefon
              adatokkal
            </label>
          ) : null}

          <div className='grid gap-4 md:grid-cols-5'>
            <Input
              label='Keresztnév'
              value={driver.firstName_1}
              onChange={(event) =>
                formModel.updateDriver(index, 'firstName_1', event.target.value)
              }
              disabled={index === 0 && formModel.primaryDriverMatchesContact}
            />
            <Input
              label='Vezetéknév'
              value={driver.lastName_1}
              onChange={(event) =>
                formModel.updateDriver(index, 'lastName_1', event.target.value)
              }
              disabled={index === 0 && formModel.primaryDriverMatchesContact}
            />
            <Input
              label='Telefon'
              value={driver.phoneNumber}
              onChange={(event) =>
                formModel.updateDriver(index, 'phoneNumber', event.target.value)
              }
              disabled={index === 0 && formModel.primaryDriverMatchesContact}
            />
            <Input
              label='E-mail'
              type='email'
              value={driver.email}
              onChange={(event) =>
                formModel.updateDriver(index, 'email', event.target.value)
              }
              disabled={index === 0 && formModel.primaryDriverMatchesContact}
            />
            <Input
              label='Születési dátum'
              type='date'
              value={driver.dateOfBirth}
              onChange={(event) =>
                formModel.updateDriver(index, 'dateOfBirth', event.target.value)
              }
            />
          </div>

          <div className='space-y-3'>
            <h4 className='text-sm font-semibold text-muted-foreground'>
              Lakcím
            </h4>
            <div className='grid gap-4 md:grid-cols-3'>
              <Input
                label='Ország'
                value={driver.locationCountry}
                onChange={(event) =>
                  formModel.updateDriver(
                    index,
                    'locationCountry',
                    event.target.value,
                  )
                }
              />
              <Input
                label='Irányítószám'
                value={driver.locationPostalCode}
                onChange={(event) =>
                  formModel.updateDriver(
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
                  formModel.updateDriver(
                    index,
                    'locationCity',
                    event.target.value,
                  )
                }
              />
              <Input
                label='Utca'
                value={driver.locationStreet}
                onChange={(event) =>
                  formModel.updateDriver(
                    index,
                    'locationStreet',
                    event.target.value,
                  )
                }
              />
              <Input
                label='Közterület jellege'
                value={driver.locationStreetType}
                onChange={(event) =>
                  formModel.updateDriver(
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
                  formModel.updateDriver(
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
            <div className='grid gap-4 md:grid-cols-3'>
              <FloatingSelect
                label='Okmány típusa'
                value={driver.documentType}
                onChange={(event) =>
                  formModel.updateDriver(
                    index,
                    'documentType',
                    event.target.value,
                  )
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
                  formModel.updateDriver(
                    index,
                    'documentNumber',
                    event.target.value,
                  )
                }
              />

              <Input
                label='Érvényesség vége'
                type='date'
                value={driver.validUntil}
                onChange={(event) =>
                  formModel.updateDriver(
                    index,
                    'validUntil',
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='text-sm font-semibold text-muted-foreground'>
              Jogosítvány
            </h4>
            <div className='grid gap-4 md:grid-cols-3'>
              <Input
                label='Jogosítvány száma'
                value={driver.drivingLicenceNumber}
                onChange={(event) =>
                  formModel.updateDriver(
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
                  formModel.updateDriver(
                    index,
                    'drivingLicenceCategory',
                    event.target.value,
                  )
                }
              />

              <Input
                label='Érvényesség vége'
                type='date'
                value={driver.drivingLicenceValidUntil}
                onChange={(event) =>
                  formModel.updateDriver(
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
  );
}
