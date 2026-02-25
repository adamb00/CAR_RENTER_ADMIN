import { cn } from '@/lib/utils';
import * as React from 'react';

interface FloatingSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  alwaysFloatLabel?: boolean;
}

const FloatingSelect = React.forwardRef<HTMLSelectElement, FloatingSelectProps>(
  (
    {
      className,
      label,
      alwaysFloatLabel = true,
      onChange,
      onBlur,
      value,
      defaultValue,
      children,
      ...props
    },
    ref
  ) => {
    const [hasValue, setHasValue] = React.useState<boolean>(
      alwaysFloatLabel || Boolean(value ?? defaultValue)
    );

    React.useEffect(() => {
      if (alwaysFloatLabel) {
        setHasValue(true);
        return;
      }
      setHasValue(Boolean(value ?? defaultValue));
    }, [alwaysFloatLabel, value, defaultValue]);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setHasValue(event.target.value !== '');
      onChange?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
      setHasValue(event.target.value !== '');
      onBlur?.(event);
    };

    return (
      <div className='relative w-full'>
        <select
          ref={ref}
          className={cn(
            'peer block h-12 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm outline-none transition-all',
            'focus:border-slate-600 focus:ring-1 focus:ring-slate-600 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        >
          {children}
        </select>
        <label
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all',
            'peer-focus:-top-3 peer-focus:-translate-y-0 peer-focus:translate-x-2 peer-focus:bg-background peer-focus:px-2 peer-focus:text-sm peer-focus:text-slate-600',
            (hasValue || alwaysFloatLabel) &&
              '-top-0.5 translate-x-2 bg-background px-2 text-sm text-slate-600'
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingSelect.displayName = 'FloatingSelect';

export { FloatingSelect };
