export default function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hoverable = false,
}) {
  return (
    <div
      className={`card-base ${
        hoverable ? 'hover:shadow-lg cursor-pointer transition-shadow' : ''
      } ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={title ? 'mb-4' : ''}>
        {children}
      </div>

      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
