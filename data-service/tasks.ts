import { TaskFormValues } from '@/components/tasks/new-task';
import { db } from '@/lib/db';
import { normalizeTaskPriority } from '@/lib/task-priority';
import { Task, TaskStatus } from '@prisma/client';

export type TaskWithUserNames = Task & {
  createdByName: string | null;
  assignedToName: string | null;
};

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

export const getAllTasks = async (): Promise<TaskWithUserNames[]> => {
  const [tasks, users] = await Promise.all([
    db.task.findMany(),
    db.user.findMany(),
  ]);
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  return tasks.map((task) => ({
    ...task,
    createdByName: task.createdBy
      ? (userNameById.get(task.createdBy) ?? null)
      : null,
    assignedToName: task.assignedTo
      ? (userNameById.get(task.assignedTo) ?? null)
      : null,
  }));
};
