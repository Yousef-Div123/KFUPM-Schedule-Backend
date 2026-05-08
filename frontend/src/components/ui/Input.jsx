export default function Input({
  label,
  id,
  error,
  hint,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-lg
          placeholder:text-gray-400 text-gray-900
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, id, error, children, className = '', containerClassName = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-lg text-gray-900
          transition-colors duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400
          ${error ? 'border-red-300' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
