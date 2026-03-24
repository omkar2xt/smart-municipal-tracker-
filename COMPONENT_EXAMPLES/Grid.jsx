export default function Grid({ children, cols = 1, className = '' }) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[cols] || 'grid-cols-1';

  return (
    <div className={`grid ${colsClass} gap-6 ${className}`}>
      {children}
    </div>
  );
}
