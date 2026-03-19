import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
};
