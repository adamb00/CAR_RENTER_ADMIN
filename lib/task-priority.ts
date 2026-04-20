export const TASK_PRIORITY_LEVELS: Record<number, string> = {
  1: '1 - Kritikus (azonnal)',
  2: '2 - Nagyon sürgős (néhány órán belül)',
  3: '3 - Sürgős (még ma)',
  4: '4 - Magas (24 órán belül)',
  5: '5 - Normál',
  6: '6 - Közepes',
  7: '7 - Alacsony',
  8: '8 - Nagyon alacsony',
  9: '9 - Legkevésbé fontos',
};

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LEVELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const clampPriority = (value: number) => Math.max(1, Math.min(9, value));

export const normalizeTaskPriority = (value?: number) => {
  if (!Number.isFinite(value)) return 5;
  return clampPriority(Math.trunc(value as number));
};

// Lower number means higher priority. This helps when a task is tied to a car
// and has a close due date (handover/out/in operational tasks).
export const suggestTaskPriority = ({
  dueDate,
  assignedCar,
}: {
  dueDate?: string;
  assignedCar?: string;
}) => {
  const hasAssignedCar = Boolean(assignedCar?.trim());
  if (!dueDate) {
    return hasAssignedCar ? 5 : 7;
  }

  const dueAt = new Date(dueDate);
  if (Number.isNaN(dueAt.getTime())) {
    return hasAssignedCar ? 5 : 7;
  }

  const hoursUntilDue = (dueAt.getTime() - Date.now()) / (1000 * 60 * 60);
  let base = 9;

  if (hoursUntilDue <= 4) base = 1;
  else if (hoursUntilDue <= 12) base = 2;
  else if (hoursUntilDue <= 24) base = 3;
  else if (hoursUntilDue <= 48) base = 4;
  else if (hoursUntilDue <= 72) base = 5;
  else if (hoursUntilDue <= 7 * 24) base = 7;
  else base = 8;

  if (hasAssignedCar) {
    return clampPriority(base - 1);
  }

  return clampPriority(base + 1);
};

export const formatTaskPriorityLabel = (value?: number) =>
  TASK_PRIORITY_LEVELS[normalizeTaskPriority(value)] ?? TASK_PRIORITY_LEVELS[5];
