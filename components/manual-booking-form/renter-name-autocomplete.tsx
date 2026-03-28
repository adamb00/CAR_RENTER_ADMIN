'use client';

import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { RenterOption } from './types';

type RenterNameAutocompleteProps = {
  value: string;
  renters: RenterOption[];
  disabled?: boolean;
  invalid?: boolean;
  selectedRenterId?: string;
  onChange: (value: string) => void;
  onSelect: (renter: RenterOption) => void;
};

const normalizeSearchValue = (value: string) =>
  value.trim().toLocaleLowerCase('hu');

const buildSearchHaystack = (renter: RenterOption) =>
  [renter.name, renter.email, renter.phone, renter.companyName, renter.taxId]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLocaleLowerCase('hu');

const sortMatches = (renters: RenterOption[], query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [];

  return renters
    .filter((renter) => buildSearchHaystack(renter).includes(normalizedQuery))
    .sort((left, right) => {
      const leftStartsWith = left.name
        .toLocaleLowerCase('hu')
        .startsWith(normalizedQuery);
      const rightStartsWith = right.name
        .toLocaleLowerCase('hu')
        .startsWith(normalizedQuery);

      if (leftStartsWith !== rightStartsWith) {
        return leftStartsWith ? -1 : 1;
      }

      return left.name.localeCompare(right.name, 'hu');
    })
    .slice(0, 8);
};

export function RenterNameAutocomplete({
  value,
  renters,
  disabled = false,
  invalid = false,
  selectedRenterId,
  onChange,
  onSelect,
}: RenterNameAutocompleteProps) {
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const matches = sortMatches(renters, value);
  const showResults = isOpen && value.trim().length > 0;

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      blurTimeoutRef.current = null;
    }, 120);
  };

  return (
    <div className='relative'>
      <Input
        label='Név'
        value={value}
        required
        onChange={(event) => {
          setIsOpen(true);
          onChange(event.target.value);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-field='contactName'
        autoComplete='off'
        className={cn(invalid && 'border-destructive ring-destructive')}
        disabled={disabled}
      />
      {selectedRenterId ? (
        <p className='mt-1 text-xs text-muted-foreground'>
          Mentett bérlő kiválasztva.
        </p>
      ) : null}
      {showResults ? (
        <div className='absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-md border bg-background shadow-lg'>
          {matches.length > 0 ? (
            matches.map((renter) => (
              <button
                key={renter.id}
                type='button'
                className='flex w-full flex-col items-start gap-1 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted'
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onSelect(renter);
                  setIsOpen(false);
                }}
              >
                <span className='text-sm font-medium'>{renter.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {[renter.email, renter.phone, renter.companyName]
                    .filter((part): part is string => Boolean(part))
                    .join(' • ') || 'Nincs további mentett adat'}
                </span>
              </button>
            ))
          ) : (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              Nincs találat.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
