export const localeOptions = [
  { value: 'hu', label: 'Magyar' },
  { value: 'en', label: 'Angol' },
  { value: 'de', label: 'Német' },
  { value: 'ro', label: 'Román' },
  { value: 'fr', label: 'Francia' },
  { value: 'es', label: 'Spanyol' },
  { value: 'it', label: 'Olasz' },
  { value: 'sk', label: 'Szlovák' },
  { value: 'cz', label: 'Cseh' },
  { value: 'se', label: 'Svéd' },
  { value: 'no', label: 'Norvég' },
  { value: 'dk', label: 'Dán' },
  { value: 'pl', label: 'Lengyel' },
] as const;

export const statusOptions = [
  { value: 'new', label: 'Új' },
  { value: 'form_submitted', label: 'Foglalási űrlap kitöltve' },
  { value: 'accepted', label: 'Elfogadott' },
  { value: 'registered', label: 'Regisztrált' },
  { value: 'cancelled', label: 'Törölt' },
] as const;

export const paymentMethodOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'advance_transfer', label: 'Előre utalás' },
  { value: 'cash_on_pickup', label: 'Átvételkor készpénz' },
  { value: 'card_on_pickup', label: 'Átvételkor bankkártya' },
  { value: 'bizum_on_pickup', label: 'Bizum' },
  { value: 'revolut_on_pickup', label: 'Revolut' },
] as const;

export const placeTypeOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'airport', label: 'Átvétel a reptéren' },
  { value: 'accommodation', label: 'Átvétel a szállásnál' },
  { value: 'office', label: 'Átvétel az irodánál' },
] as const;

export const islandOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'Lanzarote', label: 'Lanzarote' },
  { value: 'Fuerteventura', label: 'Fuerteventura' },
] as const;

export const documentTypeOptions = [
  { value: '', label: 'Nincs megadva' },
  { value: 'passport', label: 'Útlevél' },
  { value: 'id_card', label: 'Személyi igazolvány' },
] as const;

export const INVALID_FIELD_CLASS =
  'border-rose-500 focus:border-rose-600 focus:ring-rose-500';
