export default function Container({ children, className = '' }) {
  return (
    <div className={`container-center ${className}`}>
      {children}
    </div>
  );
}
