'use client';
import { createTaskAction } from '@/actions/createTaskAction';
import { Booking } from '@/data-service/bookings';
import { TASK_PRIORITY_OPTIONS, suggestTaskPriority } from '@/lib/task-priority';
import { FleetVehicle, User } from '@prisma/client';
import { useEffect, useId, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { FloatingSelect } from '../ui/floating-select';
import { Form, FormControl, FormField, FormItem } from '../ui/form';
import { Input } from '../ui/input';
import { FloatingTextarea } from '../ui/textarea';

export interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string;
  status: string;
  assignedTo: string;
  createdBy?: string;
  assignedCar?: string;
  assignedBookingId?: string;
  priority: number;
}

export type TaskBookingOption = {
  id: string;
  label: string;
  contactName: string;
  rentalStart: string | null;
  rentalEnd: string | null;
  status: string | null;
  assignedCarId: string | null;
};

const TASK_TITLE_SUGGESTIONS = [
  'Autó kiadás',
  'Autó visszavétel',
  'Szerviz',
  'Takarítás',
  'Tankolás',
] as const;

export default function NewTask({
  users,
  currentUser,
  booking,
  fleet,
  bookingOptions,
}: {
  users: User[];
  currentUser: User | undefined;
  fleet: FleetVehicle[];
  booking?: Booking;
  bookingOptions: TaskBookingOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const titleSuggestionsListId = useId();
  const defaultAssignedCar = booking?.assignedFleetVehicleId ?? '';
  const defaultPriority = useMemo(
    () =>
      suggestTaskPriority({
        dueDate: '',
        assignedCar: defaultAssignedCar,
      }),
    [defaultAssignedCar],
  );

  const form = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      status: 'PENDING',
      assignedTo: '',
      createdBy: currentUser?.id || 'Unknown',
      assignedCar: defaultAssignedCar,
      assignedBookingId: booking?.id ?? '',
      priority: defaultPriority,
    },
  });

  const dueDate = form.watch('dueDate');
  const assignedCar = form.watch('assignedCar');
  const bookingById = useMemo(
    () => new Map(bookingOptions.map((item) => [item.id, item])),
    [bookingOptions],
  );

  useEffect(() => {
    if (form.formState.dirtyFields.priority) return;
    const suggested = suggestTaskPriority({ dueDate, assignedCar });
    form.setValue('priority', suggested, { shouldDirty: false });
  }, [assignedCar, dueDate, form]);

  const handleOnSubmit = async (data: TaskFormValues) => {
    if (!data.assignedTo?.trim()) {
      form.setError('assignedTo', {
        type: 'required',
        message: 'A címzett kiválasztása kötelező.',
      });
      return;
    }

    Object.assign(data, {
      dueDate: new Date(data.dueDate).toISOString(),
      createdBy: currentUser?.id || 'Unknown',
    });
    startTransition(async () => {
      await createTaskAction(data);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleOnSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-4'>
          <div className='flex gap-4 w-full'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      {...field}
                      list={titleSuggestionsListId}
                      label='Feladat címe (pl. Autó visszavétel)'
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assignedTo'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <FloatingSelect
                      {...field}
                      value={field.value}
                      label='Feladat küldése neki:'
                      alwaysFloatLabel
                      required
                    >
                      <option value=''>Válassz felhasználót</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </FloatingSelect>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <datalist id={titleSuggestionsListId}>
            {TASK_TITLE_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <div className='flex flex-wrap gap-2'>
            {TASK_TITLE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type='button'
                onClick={() =>
                  form.setValue('title', suggestion, { shouldDirty: true })
                }
                className='rounded-full border border-input px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent'
              >
                {suggestion}
              </button>
            ))}
          </div>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='flex-1'>
                <FormControl>
                  <FloatingTextarea
                    label='Feladat leírása'
                    {...field}
                    value={field.value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className='flex gap-4'>
            <FormField
              control={form.control}
              name='assignedBookingId'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <FloatingSelect
                      {...field}
                      value={field.value || ''}
                      label='Kapcsolt foglalás:'
                      alwaysFloatLabel
                      onChange={(event) => {
                        const bookingId = event.target.value;
                        field.onChange(bookingId);
                        const selectedBooking = bookingById.get(bookingId);
                        form.setValue(
                          'assignedCar',
                          selectedBooking?.assignedCarId ?? '',
                          { shouldDirty: true },
                        );
                      }}
                    >
                      <option value=''>Nincs kapcsolt foglalás</option>
                      {bookingOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {`${item.label} • ${item.contactName}${
                            item.rentalStart && item.rentalEnd
                              ? ` • ${item.rentalStart} - ${item.rentalEnd}`
                              : ''
                          }`}
                        </option>
                      ))}
                    </FloatingSelect>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='dueDate'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <Input
                      {...field}
                      type='datetime-local'
                      label='Határidő'
                      value={
                        typeof field.value === 'string'
                          ? field.value
                          : ((field.value as string | undefined) ?? '')
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='assignedCar'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <FloatingSelect
                      {...field}
                      value={field.value || ''}
                      label='Feladathoz kapcsolt auto:'
                      alwaysFloatLabel
                    >
                      <option value=''>
                        A feladathoz nem kapcsolható autó
                      </option>
                      {fleet.map((fleet) => (
                        <option key={fleet.id} value={fleet.id}>
                          {fleet.plate}
                        </option>
                      ))}
                    </FloatingSelect>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormControl>
                    <FloatingSelect
                      {...field}
                      value={String(field.value ?? defaultPriority)}
                      label='Prioritás (1 a legfontosabb)'
                      alwaysFloatLabel
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    >
                      {TASK_PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FloatingSelect>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button disabled={isPending} type='submit' className='self-end'>
          Feladat kiosztása
        </Button>
      </form>
    </Form>
  );
}
