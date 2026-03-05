export type RevenuePart = {
  label: string;
  value: number;
};

export type QuotePart = {
  label: string;
  value: number;
};

export type ArchivePart = {
  label: string;
  value: number;
  revenue: number;
};

export type ParsedMonthKey = {
  year: number;
  month: number;
};
