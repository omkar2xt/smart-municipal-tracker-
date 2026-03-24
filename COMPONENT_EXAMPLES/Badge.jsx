export default function Badge({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) {
  const variants = {
    gray: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    primary: 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
    success: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    error: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  const variantClass = variants[variant] || variants.gray;
  const sizeClass = sizes[size] || '';

  return (
    <span
      className={`${variantClass} ${sizeClass} rounded-full font-medium inline-block ${className}`}
    >
      {children}
    </span>
  );
}
