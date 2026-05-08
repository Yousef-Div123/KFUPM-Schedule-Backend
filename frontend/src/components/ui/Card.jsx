export default function Card({ children, className = '', padding = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-card border border-gray-100
        ${padding ? 'p-6' : ''}
        ${onClick ? 'cursor-pointer hover:shadow-soft transition-shadow duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}
