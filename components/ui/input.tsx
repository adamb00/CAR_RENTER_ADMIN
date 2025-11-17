import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

interface InputProps extends React.ComponentProps<'input'> {
   label: string;
   className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, value, defaultValue, onChange, onBlur, ...props }, ref) => {
   const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
   const [hasValue, setHasValue] = React.useState<boolean>();
   const isPassword = type === 'password';

   React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(String(value).length > 0);
      } else if (defaultValue) {
        setHasValue(String(defaultValue).length > 0);
      }
    }, [defaultValue, value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setHasValue(event.target.value.length > 0);
      onBlur?.(event);
    };

    return (
      <div className='relative w-full'>
         {/* Input Field */}
         <input
            type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
            ref={ref}
            placeholder=' '
            className={cn(
               'peer block w-full h-12 rounded-md border border-input bg-transparent px-3 text-base shadow-sm  outline-none transition-all',
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

         {/* Floating Label */}
         <label
            className={cn(
               'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all',
               'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400',
               'peer-focus:-top-3 peer-focus:text-sm peer-focus:text-slate-600 peer-focus:-translate-y-0 peer-focus:translate-x-2 peer-focus:bg-background peer-focus:px-2',
               hasValue && '-top-0.5 text-sm text-slate-600 translate-x-2 bg-background px-2',
               'peer-autofill:-top-0.5 peer-autofill:text-sm peer-autofill:text-slate-600 peer-autofill:translate-x-2 peer-autofill:bg-background peer-autofill:px-2'
            )}
         >
            {label}
         </label>

         {/* Password Visibility Toggle */}
         {isPassword && (
            <button
               type='button'
               onClick={() => setIsPasswordVisible(!isPasswordVisible)}
               className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-600 cursor-pointer'
               tabIndex={-1}
            >
               {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
         )}
      </div>
   );
});

Input.displayName = 'Input';

export { Input };
