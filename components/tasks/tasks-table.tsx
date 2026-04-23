'use client';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { TaskTableRow, TasksTableColumns } from './tasks-table-columns';

interface TasksTableProps {
  tasks: TaskTableRow[];
}

export default function TasksTable({ tasks }: TasksTableProps) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;

    return tasks.filter((task) => {
      const haystack = [
        task.assignedToName,
        task.createdByName,
        task.createdAt,
        task.status,
        task.title,
        task.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [tasks, search]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize]);

  useEffect(() => {
    setExpandedTaskId(null);
  }, [search, pageSize, pageIndex]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedData = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filteredData
      .slice(start, start + pageSize)
      .map((task, index) => ({ ...task, rowNumber: start + index + 1 }));
  }, [filteredData, pageSize, safePageIndex]);

  const table = useReactTable({
    data: paginatedData,
    columns: TasksTableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderDescription = (description?: string | null) => {
    const text = description?.trim();
    if (!text) return 'Nincs leírás megadva.';

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.split('\n').map((line, lineIndex) => (
      <div key={`desc-line-${lineIndex}`}>
        {line.split(urlPattern).map((part, partIndex) => {
          if (/^https?:\/\/[^\s]+$/.test(part)) {
            return (
              <a
                key={`desc-link-${lineIndex}-${partIndex}`}
                href={part}
                target='_blank'
                rel='noreferrer'
                className='text-primary underline'
                onClick={(event) => event.stopPropagation()}
              >
                {part}
              </a>
            );
          }

          return (
            <Fragment key={`desc-text-${lineIndex}-${partIndex}`}>
              {part}
            </Fragment>
          );
        })}
      </div>
    ));
  };

  return (
    <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Keresés...'
          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-80'
        />
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <label htmlFor='booking-page-size'>Oldalanként:</label>
          <select
            id='booking-page-size'
            className='rounded-md border border-input bg-background px-2 py-1 text-sm'
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) || 10)}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className='w-full table-auto text-sm'>
        <thead className='bg-muted/60 text-muted-foreground'>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className='px-4 py-3 text-left font-semibold'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={TasksTableColumns.length}
                className='px-4 py-6 text-center text-muted-foreground'
              >
                Nincs találat a jelenlegi szűrőkkel.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isExpanded = expandedTaskId === row.original.id;
              return (
                <Fragment key={row.id}>
                  <tr
                    className='cursor-pointer border-t transition-colors hover:bg-primary/5'
                    onClick={() =>
                      setExpandedTaskId((prev) =>
                        prev === row.original.id ? null : row.original.id,
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className='px-4 py-3 align-top'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                  {isExpanded ? (
                    <tr className='border-t bg-muted/20'>
                      <td
                        colSpan={TasksTableColumns.length}
                        className='px-4 py-3 text-sm text-muted-foreground'
                      >
                        {renderDescription(row.original.description)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>

      <div className='flex flex-col gap-3 border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
        <span>
          {tasks.length === 0
            ? 'Nincs találat'
            : `Találatok: ${tasks.length} • Oldal ${
                safePageIndex + 1
              } / ${totalPages}`}
        </span>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={safePageIndex === 0}
            className='rounded-md border px-3 py-1 disabled:opacity-50'
          >
            Előző
          </button>
          <button
            type='button'
            onClick={() =>
              setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={safePageIndex >= totalPages - 1}
            className='rounded-md border px-3 py-1 disabled:opacity-50'
          >
            Következő
          </button>
        </div>
      </div>
    </div>
  );
}
