'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { type Day, type WeekNumberProps } from 'react-day-picker';

import {
  updateCarDailyMultipliersAction,
  updateCarPriceActionFlagAction,
  updateCarPriceAction,
} from '@/actions/updateCarPriceAction';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import type { InitialCarPrice } from './types';

type DailyPrices = {
  lanzarote: string;
  fuerteventura: string;
};

type DailyPricesByDate = Record<string, DailyPrices>;
type Island = keyof DailyPrices;
type DailyActions = Record<Island, boolean>;
type ActionsByDate = Record<string, DailyActions>;
type SaveState = 'pending' | 'saving' | 'saved' | 'error';

const ISLAND_OPTIONS = [
  ['lanzarote', 'Lanzarote'],
  ['fuerteventura', 'Fuerteventura'],
] as const satisfies readonly [Island, string][];

type DailyPricesContextValue = {
  prices: DailyPricesByDate;
  actionsByDate: ActionsByDate;
  saveStates: Record<string, SaveState>;
  actionSaveStates: Record<string, SaveState>;
  updatePrice: (date: Date, island: Island, value: string) => void;
  updateAction: (date: Date, island: Island, action: boolean) => void;
  flushPrice: (date: Date, island: Island) => void;
};

type WeeklyPricesContextValue = {
  displayedMonth: Date;
  actionsByDate: ActionsByDate;
  weeklyPrices: Record<string, DailyPrices>;
  setWeeklyPrice: (weekKey: string, island: Island, value: string) => void;
  applyWeeklyPrice: (
    weekKey: string,
    days: Date[],
    weeklyPrice: DailyPrices,
  ) => void;
  applyWeeklyAction: (days: Date[], island: Island, action: boolean) => void;
};

const DailyPricesContext = React.createContext<DailyPricesContextValue | null>(
  null,
);
const WeeklyPricesContext =
  React.createContext<WeeklyPricesContextValue | null>(null);

const EMPTY_PRICES: DailyPrices = {
  lanzarote: '',
  fuerteventura: '',
};
const EMPTY_ACTIONS: DailyActions = {
  lanzarote: false,
  fuerteventura: false,
};
const AUTOSAVE_DELAY_MS = 600;

function getPriceFieldKey(dateKey: string, island: Island) {
  return `${dateKey}:${island}`;
}

function getActionFieldKey(dateKey: string, island: Island) {
  return `${dateKey}:${island}:action`;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function getWeekPriceKey(displayedMonth: Date, weekNumber: number) {
  return `${getMonthKey(displayedMonth)}:${weekNumber}`;
}

function isValidPriceValue(value: string) {
  return value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);
}

function buildInitialPricesByDate(initialPrices: InitialCarPrice[]) {
  return initialPrices.reduce<DailyPricesByDate>((pricesByDate, price) => {
    pricesByDate[price.date] = {
      ...(pricesByDate[price.date] ?? EMPTY_PRICES),
      [price.island]: String(price.price),
    };

    return pricesByDate;
  }, {});
}

function buildInitialActionsByDate(initialPrices: InitialCarPrice[]) {
  return initialPrices.reduce<ActionsByDate>((actionsByDate, price) => {
    actionsByDate[price.date] = {
      ...(actionsByDate[price.date] ?? EMPTY_ACTIONS),
      [price.island]: price.action,
    };

    return actionsByDate;
  }, {});
}

function DailyPriceDay({
  day,
  modifiers,
  className,
  children: _children,
  ...props
}: React.ComponentProps<typeof Day>) {
  const context = React.useContext(DailyPricesContext);

  if (!context) {
    throw new Error(
      'DailyPriceDay must be rendered inside DailyPricesContext.',
    );
  }

  const dateKey = getDateKey(day.date);
  const values = context.prices[dateKey] ?? EMPTY_PRICES;
  const actions = context.actionsByDate[dateKey] ?? EMPTY_ACTIONS;
  const formattedDate = day.date.toLocaleDateString('hu-HU');

  return (
    <td
      {...props}
      className={cn(
        className,
        'h-auto min-w-0 flex-1 aspect-auto p-1 align-top',
      )}
    >
      <div
        className={cn(
          'flex min-h-36 flex-col gap-2 rounded-md border border-border/70 bg-background p-2 text-left shadow-xs transition-colors',
          modifiers.today && 'border-primary/60 bg-primary/5',
          modifiers.outside && 'bg-muted/30 text-muted-foreground',
        )}
      >
        <div className='flex items-center justify-between gap-2'>
          <span
            className={cn(
              'text-sm font-semibold',
              modifiers.today &&
                'flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground',
            )}
          >
            {day.date.getDate()}
          </span>
        </div>

        {!modifiers.outside && (
          <div className='mt-auto space-y-2'>
            {ISLAND_OPTIONS.map(([island, label]) => (
              <div
                key={island}
                className='grid grid-cols-[1fr_auto] items-end gap-2'
              >
                <div className='flex items-end-safe gap-2'>
                  <PriceInput
                    label={label}
                    ariaLabel={`${formattedDate} – ${label} napi ár`}
                    value={values[island]}
                    saveState={
                      context.saveStates[getPriceFieldKey(dateKey, island)]
                    }
                    onChange={(value) =>
                      context.updatePrice(day.date, island, value)
                    }
                    onBlur={() => context.flushPrice(day.date, island)}
                  />
                  <ActionSwitch
                    compact
                    ariaLabel={`${formattedDate} – ${label} akciós ár`}
                    checked={actions[island]}
                    saveState={
                      context.actionSaveStates[
                        getActionFieldKey(dateKey, island)
                      ]
                    }
                    onCheckedChange={(checked) =>
                      context.updateAction(day.date, island, checked)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </td>
  );
}

function WeeklyPriceWeekNumber({
  week,
  className,
  children: _children,
  ...props
}: WeekNumberProps) {
  const context = React.useContext(WeeklyPricesContext);

  if (!context) {
    throw new Error(
      'WeeklyPriceWeekNumber must be rendered inside WeeklyPricesContext.',
    );
  }

  const weekKey = getWeekPriceKey(context.displayedMonth, week.weekNumber);
  const weeklyPrice = context.weeklyPrices[weekKey] ?? EMPTY_PRICES;
  const weekDays = week.days
    .filter((day) => !day.outside)
    .map((day) => day.date);
  const firstDay = weekDays[0];
  const lastDay = weekDays[weekDays.length - 1];
  const canApplyWeeklyPrice =
    weekDays.length > 0 &&
    Object.values(weeklyPrice).some((value) => value !== '') &&
    Object.values(weeklyPrice).every(isValidPriceValue);
  const isWeeklyAction = (island: Island) =>
    weekDays.length > 0 &&
    weekDays.every(
      (date) => context.actionsByDate[getDateKey(date)]?.[island] ?? false,
    );
  const hasPartialWeeklyAction = (island: Island) =>
    !isWeeklyAction(island) &&
    weekDays.some(
      (date) => context.actionsByDate[getDateKey(date)]?.[island] ?? false,
    );
  const weekLabel =
    firstDay && lastDay
      ? `${firstDay.toLocaleDateString('hu-HU', {
          month: 'short',
          day: 'numeric',
        })} - ${lastDay.toLocaleDateString('hu-HU', {
          month: 'short',
          day: 'numeric',
        })}`
      : `${week.weekNumber}. hét`;

  return (
    <th {...props} className={cn(className, 'shrink-0 align-top')}>
      <div className='mr-2 flex min-h-36 w-52 flex-col gap-2 rounded-md border border-border/70 bg-muted/30 p-2 text-left shadow-xs'>
        <div>
          <span className='block text-xs font-semibold'>
            {week.weekNumber}. hét
          </span>
          <span className='block text-[10px] text-muted-foreground'>
            {weekLabel}
          </span>
        </div>

        <div className='grid gap-2'>
          {ISLAND_OPTIONS.map(([island, label]) => (
            <div key={island} className='space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='block truncate text-[11px] font-medium text-muted-foreground'>
                  {label}
                </span>
                <ActionSwitch
                  compact
                  ariaLabel={`${week.weekNumber}. hét ${label} akciós ár`}
                  checked={isWeeklyAction(island)}
                  onCheckedChange={(checked) =>
                    context.applyWeeklyAction(weekDays, island, checked)
                  }
                />
              </div>
              {hasPartialWeeklyAction(island) && (
                <span className='block text-[10px] text-muted-foreground'>
                  Részben akciós
                </span>
              )}
              <span className='relative block'>
                <input
                  type='number'
                  inputMode='decimal'
                  min='0'
                  step='1'
                  value={weeklyPrice[island]}
                  onChange={(event) =>
                    context.setWeeklyPrice(weekKey, island, event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (canApplyWeeklyPrice) {
                        context.applyWeeklyPrice(
                          weekKey,
                          weekDays,
                          weeklyPrice,
                        );
                      }
                    }
                  }}
                  aria-label={`${week.weekNumber}. hét ${label} napi ára`}
                  placeholder='0'
                  className='h-7 w-full rounded-md border border-input bg-background px-2 pr-6 text-xs shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'
                />
                <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-muted-foreground'>
                  €
                </span>
              </span>
            </div>
          ))}
        </div>

        <Button
          type='button'
          size='sm'
          className='h-7 w-full text-xs'
          onClick={() =>
            context.applyWeeklyPrice(weekKey, weekDays, weeklyPrice)
          }
          disabled={!canApplyWeeklyPrice}
        >
          Alkalmaz
        </Button>
      </div>
    </th>
  );
}

function WeeklyPriceWeekNumberHeader({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th {...props} className={cn(className, 'w-52 shrink-0 text-left')}>
      <span className='block text-xs font-semibold text-muted-foreground'>
        Heti napi ár
      </span>
    </th>
  );
}

const DAILY_PRICE_CALENDAR_COMPONENTS = {
  Day: DailyPriceDay,
  WeekNumber: WeeklyPriceWeekNumber,
  WeekNumberHeader: WeeklyPriceWeekNumberHeader,
};

type PriceInputProps = {
  label: string;
  ariaLabel: string;
  value: string;
  saveState?: SaveState;
  onChange: (value: string) => void;
  onBlur: () => void;
};

const SAVE_STATE_LABELS: Record<SaveState, string> = {
  pending: 'Mentésre vár…',
  saving: 'Mentés…',
  saved: 'Mentve',
  error: 'Mentési hiba',
};

type ActionSwitchProps = {
  label?: string;
  ariaLabel: string;
  checked: boolean;
  compact?: boolean;
  saveState?: SaveState;
  onCheckedChange: (checked: boolean) => void;
};

function ActionSwitch({
  label,
  ariaLabel,
  checked,
  compact = false,
  saveState,
  onCheckedChange,
}: ActionSwitchProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'items-center gap-2 text-[11px] font-medium transition-colors',
        compact
          ? 'inline-flex h-5 w-8 justify-center rounded-full'
          : 'flex h-8 w-full justify-between rounded-2xl text-left',
        !compact &&
          (checked
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-input bg-background text-muted-foreground'),
      )}
    >
      {!compact && <span className='truncate'>{label}</span>}
      {!compact && saveState && (
        <span
          aria-live='polite'
          className={cn(
            'shrink-0 text-[10px]',
            saveState === 'error'
              ? 'text-destructive'
              : 'text-muted-foreground',
          )}
        >
          {SAVE_STATE_LABELS[saveState]}
        </span>
      )}
      <span
        className={cn(
          'relative h-4 w-7 shrink-0 rounded-full transition-colors',
          checked ? 'bg-emerald-600' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 size-3 rounded-full bg-background shadow-sm transition-transform',
            checked ? 'translate-x-3' : 'translate-x-0',
          )}
        />
      </span>
    </button>
  );
}

function PriceInput({
  label,
  ariaLabel,
  value,
  saveState,
  onChange,
  onBlur,
}: PriceInputProps) {
  return (
    <label className='block space-y-1'>
      <span className='flex items-center justify-between gap-1 text-[11px]'>
        <span className='truncate font-medium text-muted-foreground'>
          {label}
        </span>
        {/* {saveState && (
          <span
            aria-live='polite'
            className={cn(
              'shrink-0 text-[10px]',
              saveState === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground',
            )}
          >
            {SAVE_STATE_LABELS[saveState]}
          </span>
        )} */}
      </span>
      <span className='relative block'>
        <input
          type='number'
          inputMode='decimal'
          min='0'
          step='1'
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-label={ariaLabel}
          placeholder='0'
          className='h-8 w-full rounded-md border border-input bg-background px-2 pr-7 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'
        />
        <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground'>
          €
        </span>
      </span>
    </label>
  );
}

type DailyPricesCalendarProps = {
  carId: string;
  initialPrices?: InitialCarPrice[];
  initialDailyMultipliers?: Record<string, number>;
};

export function DailyPricesCalendar({
  carId,
  initialPrices = [],
  initialDailyMultipliers = {},
}: DailyPricesCalendarProps) {
  const [prices, setPrices] = React.useState<DailyPricesByDate>(() =>
    buildInitialPricesByDate(initialPrices),
  );
  const [actionsByDate, setActionsByDate] = React.useState<ActionsByDate>(() =>
    buildInitialActionsByDate(initialPrices),
  );

  const [dailyMultipliers, setDailyMultipliers] = React.useState<
    Record<string, number>
  >(initialDailyMultipliers);
  const [saveStates, setSaveStates] = React.useState<Record<string, SaveState>>(
    {},
  );
  const [actionSaveStates, setActionSaveStates] = React.useState<
    Record<string, SaveState>
  >({});
  const saveTimeoutsRef = React.useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const latestValuesRef = React.useRef(new Map<string, string>());
  const latestActionValuesRef = React.useRef(new Map<string, boolean>());
  const saveQueuesRef = React.useRef(new Map<string, Promise<void>>());
  const actionSaveQueuesRef = React.useRef(new Map<string, Promise<void>>());
  const [displayedMonth, setDisplayedMonth] = React.useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [monthlyPrices, setMonthlyPrices] = React.useState<
    Record<string, DailyPrices>
  >({});
  const [weeklyPrices, setWeeklyPrices] = React.useState<
    Record<string, DailyPrices>
  >({});
  const [isApplyingMonthlyPrice, setIsApplyingMonthlyPrice] =
    React.useState(false);

  const displayedMonthKey = getMonthKey(displayedMonth);
  const monthlyPrice = monthlyPrices[displayedMonthKey] ?? EMPTY_PRICES;
  const monthlyPriceValues = Object.values(monthlyPrice);
  const canApplyMonthlyPrices =
    monthlyPriceValues.some((value) => value !== '') &&
    monthlyPriceValues.every(isValidPriceValue);

  React.useEffect(() => {
    setPrices(buildInitialPricesByDate(initialPrices));
    setActionsByDate(buildInitialActionsByDate(initialPrices));
  }, [initialPrices]);

  const savePrice = React.useCallback(
    (dateKey: string, island: Island, value: string) => {
      const fieldKey = getPriceFieldKey(dateKey, island);
      const existingTimeout = saveTimeoutsRef.current.get(fieldKey);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
        saveTimeoutsRef.current.delete(fieldKey);
      }

      const previousSave = saveQueuesRef.current.get(fieldKey);
      const saveRequest = (previousSave ?? Promise.resolve())
        .catch(() => undefined)
        .then(async () => {
          if (latestValuesRef.current.get(fieldKey) === value) {
            setSaveStates((current) => ({
              ...current,
              [fieldKey]: 'saving',
            }));
          }

          const result: unknown = await updateCarPriceAction(
            carId,
            dateKey,
            island,
            Number(value) || 0,
          );

          if (
            result &&
            typeof result === 'object' &&
            'error' in result &&
            typeof result.error === 'string'
          ) {
            throw new Error(result.error);
          }

          if (latestValuesRef.current.get(fieldKey) === value) {
            setSaveStates((current) => ({
              ...current,
              [fieldKey]: 'saved',
            }));
          }
        })
        .catch((error) => {
          console.error('updateCarPriceAction', error);

          if (latestValuesRef.current.get(fieldKey) === value) {
            setSaveStates((current) => ({
              ...current,
              [fieldKey]: 'error',
            }));
          }
        });

      saveQueuesRef.current.set(fieldKey, saveRequest);
    },
    [carId],
  );

  const schedulePriceSave = React.useCallback(
    (dateKey: string, island: Island, value: string) => {
      const fieldKey = getPriceFieldKey(dateKey, island);
      const existingTimeout = saveTimeoutsRef.current.get(fieldKey);

      if (existingTimeout) clearTimeout(existingTimeout);

      latestValuesRef.current.set(fieldKey, value);
      setSaveStates((current) => ({
        ...current,
        [fieldKey]: 'pending',
      }));

      const timeout = setTimeout(() => {
        saveTimeoutsRef.current.delete(fieldKey);
        savePrice(dateKey, island, value);
      }, AUTOSAVE_DELAY_MS);

      saveTimeoutsRef.current.set(fieldKey, timeout);
    },
    [savePrice],
  );

  const updatePrice = React.useCallback(
    (date: Date, island: Island, value: string) => {
      const dateKey = getDateKey(date);

      setPrices((currentPrices) => ({
        ...currentPrices,
        [dateKey]: {
          ...(currentPrices[dateKey] ?? EMPTY_PRICES),
          [island]: value,
        },
      }));

      schedulePriceSave(dateKey, island, value);
    },
    [schedulePriceSave],
  );

  const saveAction = React.useCallback(
    (dateKey: string, island: Island, action: boolean) => {
      const fieldKey = getActionFieldKey(dateKey, island);
      latestActionValuesRef.current.set(fieldKey, action);

      setActionSaveStates((current) => ({
        ...current,
        [fieldKey]: 'saving',
      }));

      const previousSave = actionSaveQueuesRef.current.get(fieldKey);
      const saveRequest = (previousSave ?? Promise.resolve())
        .catch(() => undefined)
        .then(async () => {
          const result: unknown = await updateCarPriceActionFlagAction(
            carId,
            dateKey,
            island,
            action,
          );

          if (
            result &&
            typeof result === 'object' &&
            'error' in result &&
            typeof result.error === 'string'
          ) {
            throw new Error(result.error);
          }

          if (latestActionValuesRef.current.get(fieldKey) === action) {
            setActionSaveStates((current) => ({
              ...current,
              [fieldKey]: 'saved',
            }));
          }
        })
        .catch((error) => {
          console.error('updateCarPriceActionFlagAction', error);

          if (latestActionValuesRef.current.get(fieldKey) === action) {
            setActionSaveStates((current) => ({
              ...current,
              [fieldKey]: 'error',
            }));
          }
        });

      actionSaveQueuesRef.current.set(fieldKey, saveRequest);
    },
    [carId],
  );

  const updateAction = React.useCallback(
    (date: Date, island: Island, action: boolean) => {
      const dateKey = getDateKey(date);

      setActionsByDate((currentActions) => ({
        ...currentActions,
        [dateKey]: {
          ...(currentActions[dateKey] ?? EMPTY_ACTIONS),
          [island]: action,
        },
      }));

      saveAction(dateKey, island, action);
    },
    [saveAction],
  );

  const setWeeklyPrice = React.useCallback(
    (weekKey: string, island: Island, value: string) => {
      setWeeklyPrices((currentPrices) => ({
        ...currentPrices,
        [weekKey]: {
          ...(currentPrices[weekKey] ?? EMPTY_PRICES),
          [island]: value,
        },
      }));
    },
    [],
  );

  const applyWeeklyPrice = React.useCallback(
    (weekKey: string, days: Date[], weeklyPrice: DailyPrices) => {
      const weeklyPriceValues = Object.values(weeklyPrice);
      const canApplyWeeklyPrice =
        days.length > 0 &&
        weeklyPriceValues.some((value) => value !== '') &&
        weeklyPriceValues.every(isValidPriceValue);

      if (!canApplyWeeklyPrice) return;

      const nextPrices = { ...prices };
      const pricesToSave: Array<{
        dateKey: string;
        island: Island;
        value: string;
      }> = [];

      days.forEach((date) => {
        const dateKey = getDateKey(date);
        const currentDayPrices = nextPrices[dateKey] ?? EMPTY_PRICES;
        const nextDayPrices = { ...currentDayPrices };

        ISLAND_OPTIONS.forEach(([island]) => {
          const value = weeklyPrice[island];

          if (value === '') return;

          nextDayPrices[island] = value;
          pricesToSave.push({ dateKey, island, value });
        });

        nextPrices[dateKey] = nextDayPrices;
      });

      setPrices(nextPrices);
      pricesToSave.forEach(({ dateKey, island, value }) => {
        schedulePriceSave(dateKey, island, value);
      });

      setWeeklyPrices((currentPrices) => ({
        ...currentPrices,
        [weekKey]: weeklyPrice,
      }));
    },
    [prices, schedulePriceSave],
  );

  const applyWeeklyAction = React.useCallback(
    (days: Date[], island: Island, action: boolean) => {
      if (days.length === 0) return;

      const dateKeys = days.map(getDateKey);

      setActionsByDate((currentActions) => {
        const nextActions = { ...currentActions };

        dateKeys.forEach((dateKey) => {
          nextActions[dateKey] = {
            ...(nextActions[dateKey] ?? EMPTY_ACTIONS),
            [island]: action,
          };
        });

        return nextActions;
      });

      dateKeys.forEach((dateKey) => {
        saveAction(dateKey, island, action);
      });
    },
    [saveAction],
  );

  const flushPrice = React.useCallback(
    (date: Date, island: Island) => {
      const dateKey = getDateKey(date);
      const fieldKey = getPriceFieldKey(dateKey, island);
      const timeout = saveTimeoutsRef.current.get(fieldKey);

      if (!timeout) return;

      clearTimeout(timeout);
      saveTimeoutsRef.current.delete(fieldKey);

      const value = latestValuesRef.current.get(fieldKey);
      if (value !== undefined) savePrice(dateKey, island, value);
    },
    [savePrice],
  );

  React.useEffect(() => {
    const timeouts = saveTimeoutsRef.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
      prices,
      actionsByDate,
      saveStates,
      actionSaveStates,
      updatePrice,
      updateAction,
      flushPrice,
    }),
    [
      actionsByDate,
      actionSaveStates,
      flushPrice,
      prices,
      saveStates,
      updateAction,
      updatePrice,
    ],
  );
  const weeklyContextValue = React.useMemo(
    () => ({
      displayedMonth,
      actionsByDate,
      weeklyPrices,
      setWeeklyPrice,
      applyWeeklyPrice,
      applyWeeklyAction,
    }),
    [
      actionsByDate,
      applyWeeklyAction,
      applyWeeklyPrice,
      displayedMonth,
      setWeeklyPrice,
      weeklyPrices,
    ],
  );

  const applyMonthlyPrice = React.useCallback(async () => {
    if (!canApplyMonthlyPrices || isApplyingMonthlyPrice) return;

    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    const nextPrices = { ...prices };
    const pricesToSave: Array<{
      dateKey: string;
      island: Island;
      value: string;
    }> = [];

    for (let day = 1; day <= numberOfDays; day += 1) {
      const dateKey = getDateKey(new Date(year, month, day));
      const currentDayPrices = nextPrices[dateKey] ?? EMPTY_PRICES;
      const nextDayPrices = { ...currentDayPrices };

      ISLAND_OPTIONS.forEach(([island]) => {
        const value = monthlyPrice[island];

        if (value === '') return;

        nextDayPrices[island] = value;
        pricesToSave.push({ dateKey, island, value });
      });

      nextPrices[dateKey] = nextDayPrices;
    }

    setPrices(nextPrices);
    setIsApplyingMonthlyPrice(true);

    const nextSaveStates = pricesToSave.reduce<Record<string, SaveState>>(
      (states, { dateKey, island, value }) => {
        const fieldKey = getPriceFieldKey(dateKey, island);
        const existingTimeout = saveTimeoutsRef.current.get(fieldKey);

        if (existingTimeout) {
          clearTimeout(existingTimeout);
          saveTimeoutsRef.current.delete(fieldKey);
        }

        latestValuesRef.current.set(fieldKey, value);
        states[fieldKey] = 'saving';

        return states;
      },
      {},
    );

    setSaveStates((current) => ({
      ...current,
      ...nextSaveStates,
    }));

    try {
      await Promise.all(
        pricesToSave.map(async ({ dateKey, island, value }) => {
          const fieldKey = getPriceFieldKey(dateKey, island);

          try {
            const result: unknown = await updateCarPriceAction(
              carId,
              dateKey,
              island,
              Number(value) || 0,
            );

            if (
              result &&
              typeof result === 'object' &&
              'error' in result &&
              typeof result.error === 'string'
            ) {
              throw new Error(result.error);
            }

            setSaveStates((current) => ({
              ...current,
              [fieldKey]: 'saved',
            }));
          } catch (error) {
            console.error('updateCarPriceAction', error);

            setSaveStates((current) => ({
              ...current,
              [fieldKey]: 'error',
            }));
          }
        }),
      );
    } finally {
      setIsApplyingMonthlyPrice(false);
    }
  }, [
    carId,
    canApplyMonthlyPrices,
    displayedMonth,
    isApplyingMonthlyPrice,
    monthlyPrice,
    prices,
  ]);

  return (
    <section className='space-y-3'>
      {isApplyingMonthlyPrice && (
        <div
          role='status'
          aria-live='polite'
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]'
        >
          <Button
            type='button'
            size='lg'
            className='pointer-events-none min-w-56 shadow-lg'
            disabled
          >
            <Loader2 className='size-4 animate-spin' />
            Árak mentése...
          </Button>
        </div>
      )}
      <div>
        <h3 className='text-base font-semibold'>Napi árak</h3>
        <p className='text-sm text-muted-foreground'>
          Add meg szigetenként az adott naphoz tartozó árat euróban.
        </p>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <div className='flex min-w-190 flex-wrap items-end gap-3 border-b bg-muted/30 p-3'>
          <h4 className='w-full text-sm font-semibold'>
            Teljes havi ár –{' '}
            {displayedMonth.toLocaleDateString('hu-HU', {
              year: 'numeric',
              month: 'long',
            })}
          </h4>

          {ISLAND_OPTIONS.map(([island, label]) => (
            <label key={island} className='min-w-56 flex-1 space-y-1'>
              <span className='block text-sm font-medium'>{label}</span>
              <span className='relative block'>
                <input
                  type='number'
                  inputMode='decimal'
                  min='0'
                  step='0.01'
                  value={monthlyPrice[island]}
                  onChange={(event) =>
                    setMonthlyPrices((currentPrices) => ({
                      ...currentPrices,
                      [displayedMonthKey]: {
                        ...(currentPrices[displayedMonthKey] ?? EMPTY_PRICES),
                        [island]: event.target.value,
                      },
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (canApplyMonthlyPrices) applyMonthlyPrice();
                    }
                  }}
                  aria-label={`${label} teljes havi ára`}
                  placeholder='0'
                  className='h-10 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'
                />
                <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground'>
                  €
                </span>
              </span>
            </label>
          ))}

          <Button
            type='button'
            onClick={applyMonthlyPrice}
            disabled={!canApplyMonthlyPrices || isApplyingMonthlyPrice}
          >
            {isApplyingMonthlyPrice
              ? 'Árak mentése...'
              : 'Alkalmazás a teljes hónapra'}
          </Button>

          <p className='w-full text-xs text-muted-foreground'>
            A megadott árat a hozzá tartozó sziget minden napjára beállítja. Az
            üresen hagyott sziget árait nem módosítja.
          </p>
        </div>

        <WeeklyPricesContext.Provider value={weeklyContextValue}>
          <DailyPricesContext.Provider value={contextValue}>
            <Calendar
              showOutsideDays
              showWeekNumber
              month={displayedMonth}
              onMonthChange={setDisplayedMonth}
              className='min-w-250 w-full border-0'
              classNames={{
                root: 'w-full',
                month: 'flex w-full flex-col gap-4',
                month_grid: 'w-full border-collapse',
                week_number_header: 'w-52 shrink-0 text-left',
                week_number: 'w-52 shrink-0',
                day: 'group/day relative h-auto min-w-0 flex-1 aspect-auto p-0 text-left',
              }}
              components={DAILY_PRICE_CALENDAR_COMPONENTS}
            />
          </DailyPricesContext.Provider>
        </WeeklyPricesContext.Provider>

        <div className='flex flex-col items-start justify-between border-t bg-muted/30 p-3 gap-6'>
          <h3 className='text-sm text-muted-foreground '>Napi szorzók</h3>
          <div className='grid grid-cols-6 gap-6 mx-auto'>
            {[2, 3, 5, 7, 14, 30].map((item, index) => (
              <label key={index} className='w-full flex-1 space-y-1'>
                <span className='block text-sm font-medium'>{item} nap </span>
                <input
                  type='number'
                  onChange={(event) =>
                    setDailyMultipliers((currentMultipliers) => ({
                      ...currentMultipliers,
                      [item]: parseFloat(event.target.value) || 0,
                    }))
                  }
                  inputMode='decimal'
                  min='0'
                  value={dailyMultipliers?.[item] ?? ''}
                  aria-label={`${item} napos szorzó`}
                  step='0.001'
                  placeholder='0'
                  className='h-10 w-full rounded-md border border-input bg-background px-3  text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'
                />
              </label>
            ))}
          </div>
          <Button
            type='button'
            onClick={async () =>
              await updateCarDailyMultipliersAction(
                carId,
                dailyMultipliers ?? {},
              )
            }
          >
            Mentés
          </Button>
        </div>
      </div>
    </section>
  );
}
