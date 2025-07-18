import React from 'react';
import clsx from 'clsx';

// Reusable text input wrapper. Exactly the same DOM element (<input>) so existing
// form behaviour / validation libraries continue to work unchanged.
// Props: everything native <input> supports +
//  - error: string | boolean  → optional validation message / flag
//  - className: extra Tailwind classes
const Input = React.forwardRef(({ error, className = '', ...rest }, ref) => {
  return (
    <div>
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          className,
        )}
        {...rest}
      />
      {error && typeof error === 'string' && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
