import React from 'react';
import clsx from 'clsx';

// Reusable checkbox wrapper. Renders native input[type=checkbox] so logic stays same.
// Props: label (optional), error, className, plus all native props.
const Checkbox = React.forwardRef(({ label, error, className = '', ...rest }, ref) => (
  <label className={clsx('inline-flex items-center space-x-2', className)}>
    <input
      type="checkbox"
      ref={ref}
      className={clsx(
        'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
        error && 'border-red-500',
      )}
      {...rest}
    />
    {label && <span className="text-sm text-gray-700">{label}</span>}
    {error && typeof error === 'string' && (
      <span className="text-red-500 text-xs ml-1">{error}</span>
    )}
  </label>
));

Checkbox.displayName = 'Checkbox';

export default Checkbox;
