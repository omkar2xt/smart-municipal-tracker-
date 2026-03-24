export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'btn-base font-semibold transition-all duration-200';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClass = variants[variant] || '';
  const sizeClass = sizes[size] || '';

  return (
    <button
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
