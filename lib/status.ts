import {
  CONTACT_STATUS_NEW,
  CONTACT_STATUS_QUOTE_ACCEPTED,
  CONTACT_STATUS_QUOTE_SENT,
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_CANCELLED,
  RENT_STATUS_FORM_SUBMITTED,
  RENT_STATUS_NEW,
  RENT_STATUS_REGISTERED,
} from '@/lib/constants';

type StatusMeta = { label: string; color: string; badge: string };

const buildRecord = (entries: [string, string][]) =>
  entries.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

const LABELS = buildRecord([
  [CONTACT_STATUS_NEW, 'Új'],
  [RENT_STATUS_NEW, 'Új'],
  ['new', 'Új'],
  ['uj', 'Új'],
  ['contacted', 'Ajánlat kiküldve'],
  ['pending', 'Ajánlat kiküldve'],
  ['in_progress', 'Ajánlat kiküldve'],
  [CONTACT_STATUS_QUOTE_SENT, 'Ajánlat kiküldve'],
  ['answered', 'Ajánlat kiküldve'],
  ['ajanlat_kikuldve', 'Ajánlat kiküldve'],
  [CONTACT_STATUS_QUOTE_ACCEPTED, 'Ajánlat elfogadva'],
  ['resolved', 'Ajánlat elfogadva'],
  ['closed', 'Ajánlat elfogadva'],
  ['ajanlat_elfogadva', 'Ajánlat elfogadva'],
  [RENT_STATUS_FORM_SUBMITTED, 'Foglalási űrlap kitöltve'],
  ['foglalasi_urlap_kitoltve', 'Foglalási űrlap kitöltve'],
  ['done', 'Foglalási űrlap kitöltve'],
  [RENT_STATUS_ACCEPTED, 'Elfogadott'],
  ['elfogadott', 'Elfogadott'],
  [RENT_STATUS_REGISTERED, 'Regisztrált'],
  ['registered', 'Regisztrált'],
  ['regisztralt', 'Regisztrált'],
  [RENT_STATUS_CANCELLED, 'Törölt'],
  ['torolt', 'Törölt'],
  ['canceled', 'Törölt'],
  ['cancelled', 'Törölt'],
]);

const COLORS = buildRecord([
  [CONTACT_STATUS_NEW, 'bg-sky-100 text-sky-800 border-sky-200'],
  [RENT_STATUS_NEW, 'bg-sky-100 text-sky-800 border-sky-200'],
  ['new', 'bg-sky-100 text-sky-800 border-sky-200'],
  ['uj', 'bg-sky-100 text-sky-800 border-sky-200'],
  ['contacted', 'bg-amber-100 text-amber-800 border-amber-200'],
  ['pending', 'bg-amber-100 text-amber-800 border-amber-200'],
  ['in_progress', 'bg-amber-100 text-amber-800 border-amber-200'],
  [CONTACT_STATUS_QUOTE_SENT, 'bg-amber-100 text-amber-800 border-amber-200'],
  ['answered', 'bg-amber-100 text-amber-800 border-amber-200'],
  ['ajanlat_kikuldve', 'bg-amber-100 text-amber-800 border-amber-200'],
  [
    CONTACT_STATUS_QUOTE_ACCEPTED,
    'bg-emerald-100 text-emerald-800 border-emerald-200',
  ],
  ['resolved', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  ['closed', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  ['ajanlat_elfogadva', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  [RENT_STATUS_FORM_SUBMITTED, 'bg-blue-100 text-blue-800 border-blue-200'],
  ['foglalasi_urlap_kitoltve', 'bg-blue-100 text-blue-800 border-blue-200'],
  ['done', 'bg-blue-100 text-blue-800 border-blue-200'],
  [RENT_STATUS_ACCEPTED, 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  ['elfogadott', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  [RENT_STATUS_REGISTERED, 'bg-slate-900 text-white border-slate-900'],
  ['registered', 'bg-slate-900 text-white border-slate-900'],
  ['regisztralt', 'bg-slate-900 text-white border-slate-900'],
  [RENT_STATUS_CANCELLED, 'bg-red-100 text-red-800 border-red-200'],
  ['torolt', 'bg-red-100 text-red-800 border-red-200'],
  ['canceled', 'bg-red-100 text-red-800 border-red-200'],
  ['cancelled', 'bg-red-100 text-red-800 border-red-200'],
]);

export const getStatusMeta = (status?: string | null): StatusMeta => {
  const key = status ?? '';
  const label = key ? LABELS[key] ?? key : '—';
  const badge = key
    ? COLORS[key] ?? 'bg-muted text-foreground border-border'
    : 'bg-muted text-foreground border-border';
  const color = badge;
  return { label, color, badge };
};
