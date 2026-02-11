import { cn } from '@/lib/utils';
import * as React from 'react';

interface FloatingTextareaProps extends React.ComponentProps<'textarea'> {
  label: string;
  className?: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  (
    { className, label, value, defaultValue, onChange, onBlur, ...props },
    ref
  ) => {
    const [hasValue, setHasValue] = React.useState<boolean>();

    React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(String(value).length > 0);
      } else if (defaultValue) {
        setHasValue(String(defaultValue).length > 0);
      }
    }, [defaultValue, value]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setHasValue(event.target.value.length > 0);
      onBlur?.(event);
    };

    return (
      <div className='relative w-full'>
        <textarea
          ref={ref}
          placeholder=' '
          className={cn(
            'peer block w-full min-h-[90px] rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm outline-none transition-all',
            'focus:border-slate-600 focus:ring-1 focus:ring-slate-600 disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder-transparent',
            className
          )}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />

        <label
          className={cn(
            'absolute left-3 top-3 text-gray-500 text-sm transition-all',
            'peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400',
            'peer-focus:-top-2 peer-focus:text-xs peer-focus:text-slate-600 peer-focus:bg-background peer-focus:px-2',
            hasValue && '-top-2 text-xs text-slate-600 bg-background px-2',
            'peer-autofill:-top-2 peer-autofill:text-xs peer-autofill:text-slate-600 peer-autofill:bg-background peer-autofill:px-2'
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingTextarea.displayName = 'FloatingTextarea';

export { FloatingTextarea };
