'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface DatePickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  allowClear?: boolean;
  minYear?: number;
  maxYear?: number;
  mode?: 'native' | 'select';
  className?: string;
}

type DateParts = {
  year: string;
  month: string;
  day: string;
};

const emptyDateParts: DateParts = {
  year: '',
  month: '',
  day: '',
};

const parseDateParts = (value?: string): DateParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return emptyDateParts;

  return {
    year: match[1] ?? '',
    month: match[2] ?? '',
    day: match[3] ?? '',
  };
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

const getDaysInMonth = (year: string, month: string) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  if (!numericMonth) return 31;

  return new Date(numericYear || 2000, numericMonth, 0).getDate();
};

export const DatePicker = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  allowClear: _allowClear,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
  mode = 'native',
  className,
}: DatePickerProps) => {
  const minDate = `${minYear}-01-01`;
  const maxDate = `${maxYear}-12-31`;
  const [draftParts, setDraftParts] = React.useState<DateParts>(() =>
    parseDateParts(value),
  );

  React.useEffect(() => {
    setDraftParts(parseDateParts(value));
  }, [value]);

  const years = React.useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
        String(maxYear - index),
      ),
    [maxYear, minYear],
  );
  const months = React.useMemo(
    () => Array.from({ length: 12 }, (_, index) => padDatePart(index + 1)),
    [],
  );
  const days = React.useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(draftParts.year, draftParts.month) },
        (_, index) => padDatePart(index + 1),
      ),
    [draftParts.month, draftParts.year],
  );

  const updateSelectPart = (part: keyof DateParts, partValue: string) => {
    setDraftParts((previous) => {
      const next = { ...previous, [part]: partValue };
      const maxDay = getDaysInMonth(next.year, next.month);

      if (Number(next.day) > maxDay) {
        next.day = padDatePart(maxDay);
      }

      if (next.year && next.month && next.day) {
        onChange(`${next.year}-${next.month}-${next.day}`);
      } else {
        onChange('');
      }

      return next;
    });
  };

  if (mode === 'select') {
    return (
      <fieldset className={cn('min-w-0 space-y-1.5', className)}>
        <legend className='px-1 text-sm font-medium text-slate-600'>
          {label}
        </legend>
        <div className='grid grid-cols-[1fr_0.85fr_0.75fr] gap-2'>
          <select
            aria-label={`${label} év`}
            className='h-12 min-w-0 rounded-md border border-input bg-background px-2 text-base shadow-sm outline-none transition-all focus:border-slate-600 focus:ring-1 focus:ring-slate-600'
            value={draftParts.year}
            onChange={(event) => updateSelectPart('year', event.target.value)}
            onBlur={onBlur}
          >
            <option value=''>Év</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            aria-label={`${label} hónap`}
            className='h-12 min-w-0 rounded-md border border-input bg-background px-2 text-base shadow-sm outline-none transition-all focus:border-slate-600 focus:ring-1 focus:ring-slate-600'
            value={draftParts.month}
            onChange={(event) => updateSelectPart('month', event.target.value)}
            onBlur={onBlur}
          >
            <option value=''>Hó</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <select
            aria-label={`${label} nap`}
            className='h-12 min-w-0 rounded-md border border-input bg-background px-2 text-base shadow-sm outline-none transition-all focus:border-slate-600 focus:ring-1 focus:ring-slate-600'
            value={draftParts.day}
            onChange={(event) => updateSelectPart('day', event.target.value)}
            onBlur={onBlur}
          >
            <option value=''>Nap</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
    );
  }

  return (
    <Input
      label={label}
      type='date'
      lang='en'
      value={value ?? ''}
      min={minDate}
      max={maxDate}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
};
