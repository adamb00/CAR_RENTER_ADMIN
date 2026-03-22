'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import { createRenterAction } from '@/actions/createRenterAction';
import { paymentMethodOptions } from '@/components/manual-booking-form/constants';
import { Button } from '@/components/ui/button';
import { SortIndicator } from '@/components/ui/sort-indicator';
import { FloatingSelect } from '../ui/floating-select';
import { Input } from '../ui/input';

type RenterTableRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  companyName: string | null;
  paymentMethod: string | null;
  updatedAt: string;
};

type RentersTableProps = {
  data: RenterTableRow[];
};

type RenterDraft = {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  companyName: string;
  paymentMethod: string;
};

type SortKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'taxId'
  | 'companyName'
  | 'paymentMethod'
  | 'updatedAt';

const EMPTY_DRAFT: RenterDraft = {
  name: '',
  email: '',
  phone: '',
  taxId: '',
  companyName: '',
  paymentMethod: '',
};

const toDraft = (row: RenterTableRow): RenterDraft => ({
  name: row.name,
  email: row.email ?? '',
  phone: row.phone ?? '',
  taxId: row.taxId ?? '',
  companyName: row.companyName ?? '',
  paymentMethod: row.paymentMethod ?? '',
});

const getPaymentMethodLabel = (value: string | null) =>
  paymentMethodOptions.find((option) => option.value === value)?.label || '—';

export function RentersTable({ data }: RentersTableProps) {
  const [rows, setRows] = useState(data);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [createDraft, setCreateDraft] = useState<RenterDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RenterDraft>(EMPTY_DRAFT);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      [row.name, row.email, row.phone, row.taxId, row.companyName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const next = [...filteredRows];

    next.sort((left, right) => {
      const leftValue =
        sortKey === 'paymentMethod'
          ? getPaymentMethodLabel(left.paymentMethod)
          : (left[sortKey] ?? '');
      const rightValue =
        sortKey === 'paymentMethod'
          ? getPaymentMethodLabel(right.paymentMethod)
          : (right[sortKey] ?? '');

      if (sortKey === 'updatedAt') {
        const comparison =
          new Date(String(leftValue)).getTime() -
          new Date(String(rightValue)).getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = String(leftValue).localeCompare(
        String(rightValue),
        'hu',
        {
          sensitivity: 'base',
          numeric: true,
        },
      );
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return next;
  }, [filteredRows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize]);

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  const paginatedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [pageSize, safePageIndex, sortedRows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'updatedAt' ? 'desc' : 'asc');
  };

  const renderSortHeader = (label: string, key: SortKey) => (
    <button
      type='button'
      className='inline-flex items-center gap-1 font-semibold'
      onClick={() => toggleSort(key)}
    >
      <span>{label}</span>
      <SortIndicator direction={sortKey === key ? sortDirection : false} />
    </button>
  );

  const updateCreateField = (key: keyof RenterDraft, value: string) => {
    setCreateDraft((previous) => ({ ...previous, [key]: value }));
  };

  const updateEditField = (key: keyof RenterDraft, value: string) => {
    setEditDraft((previous) => ({ ...previous, [key]: value }));
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createRenterAction(createDraft);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      if (result.renter) {
        setRows((previous) => [result.renter as RenterTableRow, ...previous]);
      }
      setCreateDraft(EMPTY_DRAFT);
      setMessage({
        type: 'success',
        text: result.success ?? 'A bérlő elmentve.',
      });
    });
  };

  const startEditing = (row: RenterTableRow) => {
    setEditingId(row.id);
    setEditDraft(toDraft(row));
    setMessage(null);
  };

  // const cancelEditing = () => {
  //   setEditingId(null);
  //   setEditDraft(EMPTY_DRAFT);
  // };

  // const saveEditing = (id: string) => {
  //   setMessage(null);

  //   startTransition(async () => {
  //     const result = await updateRenterAction({
  //       id,
  //       ...editDraft,
  //     });

  //     if (result.error) {
  //       setMessage({ type: 'error', text: result.error });
  //       return;
  //     }

  //     if (result.renter) {
  //       setRows((previous) =>
  //         previous.map((row) =>
  //           row.id === id
  //             ? {
  //                 ...row,
  //                 ...(result.renter as RenterTableRow),
  //               }
  //             : row,
  //         ),
  //       );
  //     }
  //     setEditingId(null);
  //     setEditDraft(EMPTY_DRAFT);
  //     setMessage({
  //       type: 'success',
  //       text: result.success ?? 'A bérlő frissítve.',
  //     });
  //   });
  // };

  return (
    <div className='space-y-6'>
      <form
        onSubmit={handleCreate}
        className='rounded-xl flex flex-col border bg-card p-4 shadow-sm space-y-4'
      >
        <div className='space-y-1'>
          <h2 className='text-base font-semibold'>Új bérlő</h2>
        </div>
        <div className='grid gap-3 md:grid-cols-3 xl:grid-cols-6'>
          <Input
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            label='Név'
            value={createDraft.name}
            onChange={(event) => updateCreateField('name', event.target.value)}
          />
          <Input
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            label='E-mail'
            value={createDraft.email}
            onChange={(event) => updateCreateField('email', event.target.value)}
          />
          <Input
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            label='Telefon'
            value={createDraft.phone}
            onChange={(event) => updateCreateField('phone', event.target.value)}
          />
          <Input
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            label='Adószám'
            value={createDraft.taxId}
            onChange={(event) => updateCreateField('taxId', event.target.value)}
          />
          <Input
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            label='Cégnév'
            value={createDraft.companyName}
            onChange={(event) =>
              updateCreateField('companyName', event.target.value)
            }
          />
          <FloatingSelect
            label='Fizetési mód'
            className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            value={createDraft.paymentMethod}
            onChange={(event) =>
              updateCreateField('paymentMethod', event.target.value)
            }
          >
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FloatingSelect>
        </div>
        <Button type='submit' className='self-end' disabled={isPending}>
          {isPending ? 'Mentés...' : 'Bérlő létrehozása'}
        </Button>
      </form>

      <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
        <div className='flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            <label htmlFor='renters-page-size'>Bérlő / oldal</label>
            <select
              id='renters-page-size'
              className='h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) || 10);
              }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <input
            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-80'
            placeholder='Keresés név, e-mail, telefon, adószám alapján...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {message ? (
          <div
            className={
              message.type === 'error'
                ? 'border-b px-4 py-3 text-sm text-destructive'
                : 'border-b px-4 py-3 text-sm text-emerald-600'
            }
          >
            {message.text}
          </div>
        ) : null}

        <div className='overflow-x-auto'>
          <table className='w-full min-w-300 text-sm'>
            <thead className='bg-muted/60 text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('Név', 'name')}
                </th>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('E-mail', 'email')}
                </th>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('Telefon', 'phone')}
                </th>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('Adószám', 'taxId')}
                </th>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('Cégnév', 'companyName')}
                </th>
                <th className='px-4 py-3 text-left font-semibold'>
                  {renderSortHeader('Fizetési mód', 'paymentMethod')}
                </th>

                {/* <th className='px-4 py-3 text-left font-semibold'>Művelet</th> */}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr
                    key={row.id}
                    className='border-t hover:bg-muted/20'
                    onClick={() => {
                      if (!isEditing) startEditing(row);
                    }}
                  >
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <input
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.name}
                          onChange={(event) =>
                            updateEditField('name', event.target.value)
                          }
                        />
                      ) : (
                        row.name
                      )}
                    </td>
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <input
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.email}
                          onChange={(event) =>
                            updateEditField('email', event.target.value)
                          }
                        />
                      ) : (
                        row.email || '—'
                      )}
                    </td>
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <input
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.phone}
                          onChange={(event) =>
                            updateEditField('phone', event.target.value)
                          }
                        />
                      ) : (
                        row.phone || '—'
                      )}
                    </td>
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <input
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.taxId}
                          onChange={(event) =>
                            updateEditField('taxId', event.target.value)
                          }
                        />
                      ) : (
                        row.taxId || '—'
                      )}
                    </td>
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <input
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.companyName}
                          onChange={(event) =>
                            updateEditField('companyName', event.target.value)
                          }
                        />
                      ) : (
                        row.companyName || '—'
                      )}
                    </td>
                    <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <select
                          className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                          value={editDraft.paymentMethod}
                          onChange={(event) =>
                            updateEditField('paymentMethod', event.target.value)
                          }
                        >
                          {paymentMethodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getPaymentMethodLabel(row.paymentMethod)
                      )}
                    </td>

                    {/* <td className='px-4 py-3 align-top'>
                      {isEditing ? (
                        <div
                          className='flex items-center gap-2'
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            type='button'
                            size='sm'
                            disabled={isPending}
                            onClick={() => saveEditing(row.id)}
                          >
                            Mentés
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            disabled={isPending}
                            onClick={cancelEditing}
                          >
                            Mégse
                          </Button>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          Szerkesztés
                        </span>
                      )}
                    </td> */}
                  </tr>
                );
              })}
              {sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className='px-4 py-8 text-center text-muted-foreground'
                  >
                    Nincs megjeleníthető bérlő.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className='flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'>
          <p className='text-muted-foreground'>
            {sortedRows.length === 0
              ? 'Nincs megjeleníthető bérlő.'
              : `${safePageIndex * pageSize + 1}–${Math.min(
                  (safePageIndex + 1) * pageSize,
                  sortedRows.length,
                )} / ${sortedRows.length} bérlő`}
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
