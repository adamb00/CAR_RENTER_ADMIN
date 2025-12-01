type StatusMeta = { label: string; color: string; badge: string };

const LABELS: Record<string, string> = {
  new: 'Új',
  contacted: 'Kapcsolatfelvétel folyamatban',
  in_progress: 'Folyamatban',
  pending: 'Folyamatban',
  answered: 'Ajánlatkérés feldolgozva',
  resolved: 'Ajánlatkérés feldolgozva',
  done: 'Foglalási űrlap kitöltve',
  closed: 'Foglalási űrlap kitöltve',
  canceled: 'Lemondva',
  cancelled: 'Lemondva',
};

const COLORS: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800 border-sky-200',
  contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  answered: 'bg-amber-100 text-amber-800 border-amber-200',
  done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const getStatusMeta = (status?: string | null): StatusMeta => {
  const key = status ?? '';
  const label = key ? LABELS[key] ?? key : '—';
  const badge = key
    ? COLORS[key] ?? 'bg-muted text-foreground border-border'
    : 'bg-muted text-foreground border-border';
  const color = badge;
  return { label, color, badge };
};
