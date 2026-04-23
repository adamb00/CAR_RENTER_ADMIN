import { formatDate, formatDateTimeDetail } from '@/lib/format/format-date';
import { getStatusMeta } from '@/lib/status';
import { Task } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';

export type TaskTableRow = Task & {
  createdByName?: string | null;
  assignedToName?: string | null;
  rowNumber?: number;
};

export const TasksTableColumns: ColumnDef<TaskTableRow>[] = [
  {
    header: '#',
    cell: ({ row }) => <div>{row.original.rowNumber ?? row.index + 1}</div>,
  },
  {
    header: 'Cím',
    cell: ({ row }) => <div>{row.original.title}</div>,
  },
  {
    header: 'Kiadta',
    cell: ({ row }) => {
      return (
        <div className='flex flex-col gap-1'>
          {row.original.createdByName ?? ' '}
        </div>
      );
    },
  },
  {
    header: 'Kinek',
    cell: ({ row }) => (
      <div>{row.original.assignedToName ?? row.original.assignedTo}</div>
    ),
  },
  {
    header: 'Státusz',
    cell: ({ row }) => {
      const status = getStatusMeta(row.original.status);
      return <div>{status.label}</div>;
    },
  },
  {
    header: 'Határidő',
    cell: ({ row }) => (
      <div>{formatDateTimeDetail(row.original.dueDate?.toString())}</div>
    ),
  },
];
