'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  allowClear?: boolean;
  minYear?: number;
  maxYear?: number;
}

const MONTH_LABELS = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
];

const WEEKDAY_LABELS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value?: string) => {
  if (!value) return '';
  const parsed = parseDateString(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const DatePicker = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder = 'Dátum kiválasztása',
  allowClear,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
}: DatePickerProps) => {
  const selectedDate = useMemo(() => parseDateString(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? new Date());
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
      onBlur?.();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onBlur]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const start = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const offset = (start.getDay() + 6) % 7; // Monday as first day
    const cells: Array<Date | null> = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(year, month, day));
    }

    const totalCells = Math.ceil(cells.length / 7) * 7;
    while (cells.length < totalCells) {
      cells.push(null);
    }

    return cells;
  }, [viewDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setViewDate((current) => {
      const newDate = new Date(current);
      newDate.setMonth(current.getMonth() + (direction === 'prev' ? -1 : 1));
      const year = newDate.getFullYear();
      if (year < minYear || year > maxYear) {
        return current;
      }
      return newDate;
    });
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextYear = Number(event.target.value);
    setViewDate((current) => {
      const newDate = new Date(current);
      newDate.setFullYear(nextYear);
      return newDate;
    });
  };

  const handleSelect = (date: Date) => {
    const year = date.getFullYear();
    if (year < minYear || year > maxYear) return;
    onChange(toDateString(date));
    setIsOpen(false);
    onBlur?.();
  };

  const handleClear = () => {
    if (!allowClear) return;
    onChange('');
    onBlur?.();
  };

  const hasValue = Boolean(value);

  return (
    <div className='relative w-full'>
      <button
        ref={triggerRef}
        type='button'
        className={cn(
          'relative flex h-12 w-full items-center rounded-md border border-input bg-background px-3 text-left text-base shadow-sm outline-none transition-all',
          'focus:border-slate-600 focus:ring-1 focus:ring-slate-600',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className='pointer-events-none absolute left-3 top-2 text-xs font-medium text-slate-600'>
          {label}
        </span>
        <span
          className={cn(
            'mt-5 inline-block flex-1 truncate',
            !hasValue && 'text-muted-foreground'
          )}
        >
          {hasValue ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon className='ml-2 h-4 w-4 shrink-0 text-muted-foreground' />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className='absolute left-0 top-full z-50 mt-2 w-full rounded-md border bg-popover p-3 shadow-lg'
        >
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='sr-only'>Előző hónap</span>
            </Button>
            <div className='flex items-center gap-2'>
              <div className='text-sm font-medium capitalize'>
                {MONTH_LABELS[viewDate.getMonth()]}
              </div>
              <select
                className='h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600'
                value={viewDate.getFullYear()}
                onChange={handleYearChange}
              >
                {Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => handleMonthChange('next')}
            >
              <ChevronRight className='h-4 w-4' />
              <span className='sr-only'>Következő hónap</span>
            </Button>
          </div>

          <div className='mt-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground'>
            {WEEKDAY_LABELS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className='mt-1 grid grid-cols-7 gap-1'>
            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} />;
              }
              const isSelected =
                selectedDate &&
                cell.getFullYear() === selectedDate.getFullYear() &&
                cell.getMonth() === selectedDate.getMonth() &&
                cell.getDate() === selectedDate.getDate();
              const today = new Date();
              const isToday =
                cell.getFullYear() === today.getFullYear() &&
                cell.getMonth() === today.getMonth() &&
                cell.getDate() === today.getDate();

              return (
                <button
                  type='button'
                  key={cell.toISOString()}
                  className={cn(
                    'h-9 w-9 rounded-md text-sm transition',
                    isSelected
                      ? 'bg-slate-900 text-white hover:bg-slate-900/90'
                      : isToday
                        ? 'border border-slate-300 text-slate-900'
                        : 'hover:bg-slate-100'
                  )}
                  onClick={() => handleSelect(cell)}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>

          {allowClear && value && (
            <Button
              type='button'
              variant='ghost'
              className='mt-2 w-full justify-center text-sm text-muted-foreground'
              onClick={handleClear}
            >
              Dátum törlése
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
