'use client';

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

type MonthPickerProps = {
  value: string;
  className?: string;
};

type ParsedMonthKey = {
  year: number;
  month: number;
};

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTHS = [
  'Január',
  'Február',
  'Március',
  'Április',
  'Május',
  'Június',
  'Július',
  'Augusztus',
  'Szeptember',
  'Október',
  'November',
  'December',
] as const;

const buildMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

const parseMonthKey = (value?: string | null): ParsedMonthKey => {
  const trimmed = value?.trim();
  const now = new Date();

  if (!trimmed) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  const match = trimmed.match(MONTH_KEY_PATTERN);
  if (!match) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
  };
};

const shiftMonthKey = (value: string, diff: number): string => {
  const parsed = parseMonthKey(value);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + diff, 1));
  return buildMonthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
};

export function MonthPicker({ value, className }: MonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const parsedValue = parseMonthKey(value);
  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(parsedValue.year);

  useEffect(() => {
    setSelectedYear(parsedValue.year);
  }, [parsedValue.year]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const yearOptions = useMemo(() => {
    const start = selectedYear - 4;
    return Array.from({ length: 9 }, (_, index) => start + index);
  }, [selectedYear]);

  const navigateTo = (monthKey: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('month', monthKey);

    const query = params.toString();
    const safePathname = pathname ?? '/analitycs';
    const href = query.length > 0 ? `${safePathname}?${query}` : safePathname;

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const currentLabel = `${MONTHS[parsedValue.month - 1]} ${parsedValue.year}`;

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center gap-2', className)}>
      <button
        type='button'
        disabled={isPending}
        onClick={() => navigateTo(shiftMonthKey(value, -1))}
        className='inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50'
        aria-label='Előző hónap'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>

      <button
        type='button'
        disabled={isPending}
        onClick={() => setOpen((prev) => !prev)}
        className='inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50'
      >
        <CalendarDays className='h-4 w-4 text-muted-foreground' />
        <span>{currentLabel}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <button
        type='button'
        disabled={isPending}
        onClick={() => navigateTo(shiftMonthKey(value, 1))}
        className='inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50'
        aria-label='Következő hónap'
      >
        <ChevronRight className='h-4 w-4' />
      </button>

      {open ? (
        <div className='absolute right-0 top-11 z-30 w-[320px] rounded-lg border bg-card p-3 shadow-lg'>
          <div className='mb-3 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className='inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted'
              aria-label='Előző év'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number.parseInt(event.target.value, 10))}
              className='h-8 flex-1 rounded-md border bg-background px-2 text-sm'
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type='button'
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className='inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted'
              aria-label='Következő év'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>

          <div className='grid grid-cols-3 gap-1'>
            {MONTHS.map((monthName, index) => {
              const monthNumber = index + 1;
              const monthKey = buildMonthKey(selectedYear, monthNumber);
              const isActive =
                parsedValue.year === selectedYear && parsedValue.month === monthNumber;

              return (
                <button
                  key={monthName}
                  type='button'
                  onClick={() => {
                    navigateTo(monthKey);
                    setOpen(false);
                  }}
                  className={cn(
                    'rounded-md border px-2 py-2 text-left text-sm transition',
                    isActive
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  {monthName}
                </button>
              );
            })}
          </div>

          <button
            type='button'
            onClick={() => {
              const now = new Date();
              navigateTo(buildMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1));
              setOpen(false);
            }}
            className='mt-3 w-full rounded-md border px-3 py-2 text-sm hover:bg-muted'
          >
            Ugrás az aktuális hónapra
          </button>
        </div>
      ) : null}
    </div>
  );
}
