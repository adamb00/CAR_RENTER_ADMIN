'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { createBookingHandoverCostAction } from '@/actions/createBookingHandoverCostAction';
import { createHandoverCostTypeAction } from '@/actions/createHandoverCostTypeAction';
import { buildMonthKey, parseMonthKey } from '@/components/analitycs/utils';
import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Input } from '@/components/ui/input';
import { SortIndicator } from '@/components/ui/sort-indicator';
import { MONTHS } from '@/lib/constants';
import { formatDate } from '@/lib/format/format-date';
import {
  getHandoverCostTypeCategoryLabel,
  HandoverCostTypeCategory,
  HANDOVER_COST_TYPE_CATEGORY_OPTIONS,
} from '@/lib/handover-cost-types';

type HandoverCostRow = {
  id: string;
  bookingId: string;
  bookingLabel: string;
  contactName: string;
  direction: 'out' | 'in' | null;
  costType: string;
  costTypeLabel: string;
  costTypeCategory: HandoverCostTypeCategory;
  amount: string;
  createdAt: string;
};

type BookingOption = {
  id: string;
  label: string;
};

type CostTypeOption = {
  slug: string;
  label: string;
  category: HandoverCostTypeCategory;
  isDefault: boolean;
  usageCount: number;
};

type HandoverCostsManagerProps = {
  rows: HandoverCostRow[];
  bookingOptions: BookingOption[];
  costTypeOptions: CostTypeOption[];
};

type SortKey = 'bookingLabel' | 'costTypeLabel' | 'amount' | 'createdAt';

const DIRECTION_OPTIONS = [
  { value: 'out', label: 'Kiadás' },
  { value: 'in', label: 'Visszavétel' },
] as const;

const getDirectionLabel = (value: HandoverCostRow['direction']) =>
  DIRECTION_OPTIONS.find((option) => option.value === value)?.label ??
  'Nincs irány';

const getMonthLabel = (monthKey: string) => {
  const parsed = parseMonthKey(monthKey);
  return `${MONTHS[parsed.month - 1]} ${parsed.year}`;
};

export function HandoverCostsManager({
  rows,
  bookingOptions,
  costTypeOptions,
}: HandoverCostsManagerProps) {
  const router = useRouter();
  const [costForm, setCostForm] = useState({
    bookingId: '',
    direction: '',
    costType: costTypeOptions[0]?.slug ?? '',
    amount: '',
  });
  const [typeForm, setTypeForm] = useState<{
    label: string;
    category: HandoverCostTypeCategory;
  }>({
    label: '',
    category: 'expense',
  });
  const [costMessage, setCostMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [typeMessage, setTypeMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [isCostPending, startCostTransition] = useTransition();
  const [isTypePending, startTypeTransition] = useTransition();

  useEffect(() => {
    if (costTypeOptions.length === 0) {
      setCostForm((previous) => ({ ...previous, costType: '' }));
      return;
    }

    if (!costTypeOptions.some((option) => option.slug === costForm.costType)) {
      setCostForm((previous) => ({
        ...previous,
        costType: costTypeOptions[0]?.slug ?? '',
      }));
    }
  }, [costForm.costType, costTypeOptions]);

  const availableMonths = useMemo(() => {
    const monthKeys = Array.from(
      new Set(
        rows.map((row) => {
          const date = new Date(row.createdAt);
          return buildMonthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
        }),
      ),
    );

    return monthKeys.sort((left, right) => right.localeCompare(left));
  }, [rows]);

  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths[0] ??
      buildMonthKey(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1),
  );

  useEffect(() => {
    if (availableMonths.length === 0) return;
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const monthFilteredRows = useMemo(() => {
    return rows.filter((row) => {
      const date = new Date(row.createdAt);
      const rowMonth = buildMonthKey(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
      );
      return rowMonth === selectedMonth;
    });
  }, [rows, selectedMonth]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return monthFilteredRows;

    return monthFilteredRows.filter((row) =>
      [
        row.bookingLabel,
        row.contactName,
        getDirectionLabel(row.direction),
        row.costTypeLabel,
        getHandoverCostTypeCategoryLabel(row.costTypeCategory),
        row.amount,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [monthFilteredRows, search]);

  const sortedRows = useMemo(() => {
    const next = [...filteredRows];

    next.sort((left, right) => {
      const leftValue =
        sortKey === 'amount' ? Number(left.amount) : left[sortKey];
      const rightValue =
        sortKey === 'amount' ? Number(right.amount) : right[sortKey];

      let comparison = 0;

      if (sortKey === 'createdAt') {
        comparison =
          new Date(String(leftValue)).getTime() -
          new Date(String(rightValue)).getTime();
      } else if (sortKey === 'amount') {
        comparison = Number(leftValue) - Number(rightValue);
      } else {
        comparison = String(leftValue).localeCompare(String(rightValue), 'hu', {
          sensitivity: 'base',
          numeric: true,
        });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return next;
  }, [filteredRows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  useEffect(() => {
    setPageIndex(0);
  }, [search, selectedMonth, pageSize]);

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  const paginatedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [pageSize, safePageIndex, sortedRows]);

  const selectedMonthTotal = useMemo(() => {
    return monthFilteredRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );
  }, [monthFilteredRows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'createdAt' ? 'desc' : 'asc');
  };

  const renderSortHeader = (
    label: string,
    key: SortKey,
    align: 'left' | 'right' = 'left',
  ) => (
    <button
      type='button'
      className={`inline-flex items-center gap-1 font-medium ${align === 'right' ? 'justify-end text-right' : ''}`}
      onClick={() => toggleSort(key)}
    >
      <span>{label}</span>
      <SortIndicator direction={sortKey === key ? sortDirection : false} />
    </button>
  );

  const updateCostField = (key: keyof typeof costForm, value: string) => {
    setCostForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleCostSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCostMessage(null);

    startCostTransition(async () => {
      const result = await createBookingHandoverCostAction(costForm);

      if (result.error) {
        setCostMessage({ type: 'error', text: result.error });
        return;
      }

      setCostForm((previous) => ({
        ...previous,
        bookingId: '',
        direction: '',
        amount: '',
      }));
      setCostMessage({
        type: 'success',
        text: result.success ?? 'A költség elmentve.',
      });
      router.refresh();
    });
  };

  const handleTypeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTypeMessage(null);

    startTypeTransition(async () => {
      const result = await createHandoverCostTypeAction(typeForm);

      if (result.error) {
        setTypeMessage({ type: 'error', text: result.error });
        return;
      }

      setTypeForm({ label: '', category: 'expense' });
      setTypeMessage({
        type: 'success',
        text: result.success ?? 'A költségtípus elmentve.',
      });
      router.refresh();
    });
  };

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 xl:grid-cols-[1.4fr,1fr]'>
        <form
          onSubmit={handleCostSubmit}
          className='space-y-4 rounded-xl border bg-card p-4 shadow-sm'
        >
          <div className='space-y-1'>
            <h2 className='text-base font-semibold'>Új költség</h2>
            <p className='text-sm text-muted-foreground'>
              Rögzíts új költséget egy meglévő foglaláshoz.
            </p>
          </div>

          <div className='grid gap-4 lg:grid-cols-3'>
            <FloatingSelect
              label='Foglalás'
              value={costForm.bookingId}
              onChange={(event) =>
                updateCostField('bookingId', event.target.value)
              }
              disabled={isCostPending || bookingOptions.length === 0}
            >
              <option value=''>Válassz foglalást</option>
              {bookingOptions.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.label}
                </option>
              ))}
            </FloatingSelect>

            <FloatingSelect
              label='Költségtípus'
              value={costForm.costType}
              onChange={(event) =>
                updateCostField('costType', event.target.value)
              }
              disabled={isCostPending || costTypeOptions.length === 0}
            >
              <option value=''>Válassz költségtípust</option>
              {costTypeOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </FloatingSelect>

            <Input
              label='Összeg'
              type='number'
              min='0'
              step='0.01'
              value={costForm.amount}
              onChange={(event) =>
                updateCostField('amount', event.target.value)
              }
              disabled={isCostPending}
            />
          </div>

          {costMessage ? (
            <p
              className={
                costMessage.type === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-emerald-600'
              }
            >
              {costMessage.text}
            </p>
          ) : null}

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={
                isCostPending ||
                bookingOptions.length === 0 ||
                costTypeOptions.length === 0
              }
            >
              {isCostPending ? 'Mentés...' : 'Költség létrehozása'}
            </Button>
          </div>
        </form>

        <div className='space-y-4 rounded-xl border bg-card p-4 shadow-sm'>
          <div className='space-y-1'>
            <h2 className='text-base font-semibold'>Költségtípusok</h2>
            <p className='text-sm text-muted-foreground'>
              Itt bármikor létrehozhatsz új költség- vagy levonástípust.
            </p>
          </div>

          <form
            onSubmit={handleTypeSubmit}
            className='grid gap-4 sm:grid-cols-2 items-center'
          >
            <Input
              label='Név'
              value={typeForm.label}
              onChange={(event) =>
                setTypeForm((previous) => ({
                  ...previous,
                  label: event.target.value,
                }))
              }
              disabled={isTypePending}
            />

            <div className='flex items-end'>
              <Button type='submit' disabled={isTypePending} className='w-1/2'>
                {isTypePending ? 'Mentés...' : 'Új típus hozzáadása'}
              </Button>
            </div>
          </form>

          {typeMessage ? (
            <p
              className={
                typeMessage.type === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-emerald-600'
              }
            >
              {typeMessage.text}
            </p>
          ) : null}

          <div className='overflow-x-auto rounded-lg border'>
            <table className='min-w-full text-sm'>
              <thead className='bg-muted/40 text-left'>
                <tr>
                  <th className='px-3 py-2 font-medium'>Név</th>
                  <th className='px-3 py-2 font-medium'>Kategória</th>
                </tr>
              </thead>
              <tbody>
                {costTypeOptions.map((option) => (
                  <tr key={option.slug} className='border-t'>
                    <td className='px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{option.label}</span>
                      </div>
                    </td>
                    <td className='px-3 py-2 text-muted-foreground'>
                      {getHandoverCostTypeCategoryLabel(option.category)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <h2 className='text-base font-semibold'>Mentett költségek</h2>
            <p className='text-sm text-muted-foreground'>
              {getMonthLabel(selectedMonth)} • {monthFilteredRows.length} tétel
              • {selectedMonthTotal.toFixed(2)} €
            </p>
          </div>

          <div className='grid w-full gap-3 md:max-w-3xl md:grid-cols-3'>
            <FloatingSelect
              label='Hónap'
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {getMonthLabel(monthKey)}
                </option>
              ))}
            </FloatingSelect>

            <Input
              label='Keresés'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <FloatingSelect
              label='Elem / oldal'
              value={String(pageSize)}
              onChange={(event) =>
                setPageSize(Number(event.target.value) || 10)
              }
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FloatingSelect>
          </div>
        </div>

        {sortedRows.length === 0 ? (
          <p className='mt-4 text-sm text-muted-foreground'>
            Nincs megjeleníthető költség.
          </p>
        ) : (
          <div className='mt-4 overflow-x-auto rounded-lg border'>
            <table className='min-w-full text-sm'>
              <thead className='bg-muted/40 text-left'>
                <tr>
                  <th className='px-3 py-2 font-medium'>
                    {renderSortHeader('Foglalás', 'bookingLabel')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {renderSortHeader('Típus', 'costTypeLabel')}
                  </th>
                  <th className='px-3 py-2 text-right font-medium'>
                    {renderSortHeader('Összeg', 'amount', 'right')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {renderSortHeader('Rögzítve', 'createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='px-3 py-2 font-medium'>
                      <Link
                        href={`/bookings/${encodeURIComponent(row.bookingId)}/edit`}
                        className='hover:underline'
                      >
                        {row.bookingLabel}
                      </Link>
                    </td>

                    <td className='px-3 py-2 text-muted-foreground'>
                      <div>{row.costTypeLabel}</div>
                    </td>
                    <td className='px-3 py-2 text-right'>{row.amount} €</td>
                    <td className='px-3 py-2 text-muted-foreground'>
                      {formatDate(row.createdAt, 'long')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className='mt-4 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between'>
          <p className='text-muted-foreground'>
            {sortedRows.length === 0
              ? 'Nincs megjeleníthető költség.'
              : `${safePageIndex * pageSize + 1}–${Math.min(
                  (safePageIndex + 1) * pageSize,
                  sortedRows.length,
                )} / ${sortedRows.length} tétel`}
          </p>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50'
              onClick={() =>
                setPageIndex((previous) => Math.max(previous - 1, 0))
              }
              disabled={safePageIndex === 0}
            >
              Előző
            </button>
            <span className='text-xs font-semibold uppercase text-muted-foreground'>
              {safePageIndex + 1} / {totalPages}
            </span>
            <button
              type='button'
              className='rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50'
              onClick={() =>
                setPageIndex((previous) =>
                  Math.min(previous + 1, totalPages - 1),
                )
              }
              disabled={safePageIndex >= totalPages - 1}
            >
              Következő
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
