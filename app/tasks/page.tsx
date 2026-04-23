import TasksTable from '@/components/tasks/tasks-table';
import { getAllTasks } from '@/data-service/tasks';

export default async function page() {
  const tasks = await getAllTasks();

  return (
    <div className='flex h-full flex-1 flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Feladatok</h1>
      </div>

      {tasks.length === 0 ? (
        <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground'>
          Még nincs feladat.
        </div>
      ) : (
        <TasksTable tasks={tasks} />
      )}
    </div>
  );
}
