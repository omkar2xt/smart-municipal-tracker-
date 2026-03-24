export default function Alert({
  children,
  type = 'info',
  onClose,
  className = '',
}) {
  const types = {
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-amber-50 border-l-4 border-amber-500 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    error: 'bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-100',
  };
  
  const typeClass = types[type] || types.info;

  return (
    <div className={`p-4 rounded ${typeClass} ${className}`}>
      <div className="flex justify-between items-start">
        <div>{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert"
            className="text-lg font-bold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
