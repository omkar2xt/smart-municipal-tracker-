import React from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  className = '',
  id,
  ...props
}) {
  const inputId = id || React.useId();
  const errorId = `${inputId}-error`;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        className={`input-base ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
