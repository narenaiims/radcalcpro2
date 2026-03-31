import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  buttonClassName?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => {
  const { className, style, buttonClassName, onChange, ...rest } = props;
  
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onChange) return;
    
    const step = parseFloat(props.step as string) || 1;
    const currentVal = parseFloat(props.value as string) || 0;
    const max = props.max !== undefined ? parseFloat(props.max as string) : Infinity;
    
    const newVal = Math.min(currentVal + step, max);
    
    // Create a synthetic event
    const event = {
      target: { value: String(newVal) },
      currentTarget: { value: String(newVal) }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(event);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onChange) return;
    
    const step = parseFloat(props.step as string) || 1;
    const currentVal = parseFloat(props.value as string) || 0;
    const min = props.min !== undefined ? parseFloat(props.min as string) : -Infinity;
    
    const newVal = Math.max(currentVal - step, min);
    
    // Create a synthetic event
    const event = {
      target: { value: String(newVal) },
      currentTarget: { value: String(newVal) }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(event);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, decimals, and minus sign
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      if (onChange) onChange(e);
    }
  };

  return (
    <div className={`relative flex items-center ${className || ''}`} style={style}>
      <button 
        type="button"
        onClick={handleDecrement}
        className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg shadow-sm border transition-all active:scale-95 ${buttonClassName || 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'}`}
        tabIndex={-1}
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        pattern="[0-9\.\-]*"
        onChange={handleChange}
        {...rest}
        className="w-full min-h-[40px] sm:min-h-[44px] px-9 sm:px-12 text-center bg-transparent border-none focus:ring-0 text-base sm:text-lg font-mono"
        style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
      />
      
      <button 
        type="button"
        onClick={handleIncrement}
        className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg shadow-sm border transition-all active:scale-95 ${buttonClassName || 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'}`}
        tabIndex={-1}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
