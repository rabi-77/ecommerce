import React from 'react';
import clsx from 'clsx';

// Reusable <select> wrapper. Forward all props so existing logic remains intact.
// Optional props:
//  - error: string | boolean → shows red border and message when truthy
//  - className: additional Tailwind classes
const Select = React.forwardRef(({ error, className = '', children, ...rest }, ref) => (
  <div>
    <select
      ref={ref}
      className={clsx(
        'w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
        error ? 'border-red-500' : 'border-gray-300',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
    {error && typeof error === 'string' && (
      <p className="text-red-500 text-xs mt-1">{error}</p>
    )}
  </div>
));

Select.displayName = 'Select';

export default Select;
