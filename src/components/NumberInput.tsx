import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  buttonClassName?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => {
  const { className, style, buttonClassName, ...rest } = props;
  
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!props.onChange) return;
    
    const step = parseFloat(props.step as string) || 1;
    const currentVal = parseFloat(props.value as string) || 0;
    const max = props.max !== undefined ? parseFloat(props.max as string) : Infinity;
    
    const newVal = Math.min(currentVal + step, max);
    
    // Create a synthetic event
    const event = {
      target: { value: String(newVal) },
      currentTarget: { value: String(newVal) }
    } as React.ChangeEvent<HTMLInputElement>;
    
    props.onChange(event);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!props.onChange) return;
    
    const step = parseFloat(props.step as string) || 1;
    const currentVal = parseFloat(props.value as string) || 0;
    const min = props.min !== undefined ? parseFloat(props.min as string) : -Infinity;
    
    const newVal = Math.max(currentVal - step, min);
    
    // Create a synthetic event
    const event = {
      target: { value: String(newVal) },
      currentTarget: { value: String(newVal) }
    } as React.ChangeEvent<HTMLInputElement>;
    
    props.onChange(event);
  };

  return (
    <div className={`relative flex items-center ${className || ''}`} style={style}>
      <button 
        type="button"
        onClick={handleDecrement}
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-sm border transition-all active:scale-95 ${buttonClassName || 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'}`}
        tabIndex={-1}
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>
      
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        {...rest}
        className="w-full min-h-[44px] px-12 sm:px-14 text-center bg-transparent border-none focus:ring-0"
        style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
      />
      
      <button 
        type="button"
        onClick={handleIncrement}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-sm border transition-all active:scale-95 ${buttonClassName || 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'}`}
        tabIndex={-1}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
