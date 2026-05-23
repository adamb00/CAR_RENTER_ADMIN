'use client';

import { Input } from '@/components/ui/input';

interface DatePickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  allowClear?: boolean;
  minYear?: number;
  maxYear?: number;
}

export const DatePicker = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  allowClear: _allowClear,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
}: DatePickerProps) => {
  const minDate = `${minYear}-01-01`;
  const maxDate = `${maxYear}-12-31`;

  return (
    <Input
      label={label}
      type='date'
      lang='en'
      value={value ?? ''}
      min={minDate}
      max={maxDate}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
};
