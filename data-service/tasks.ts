import { TaskFormValues } from '@/components/tasks/new-task';
import { db } from '@/lib/db';
import { normalizeTaskPriority } from '@/lib/task-priority';
import { TaskStatus } from '@prisma/client';

export const createTask = async (data: TaskFormValues) => {
  const res = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      assignedCar: data.assignedCar?.trim() ? data.assignedCar : null,
      priority: normalizeTaskPriority(data.priority),
      status: data.status as TaskStatus,
    },
  });

  if (!res) {
    throw new Error('Task creation failed');
  }

  return res;
};
