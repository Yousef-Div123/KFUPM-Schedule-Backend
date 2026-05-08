const styles = {
  Booked: 'bg-blue-50 text-blue-700 border border-blue-100',
  Cancelled: 'bg-red-50 text-red-600 border border-red-100',
  Completed: 'bg-brand-50 text-brand-700 border border-brand-200',
  active: 'bg-brand-50 text-brand-700 border border-brand-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
  Student: 'bg-purple-50 text-purple-700 border border-purple-100',
  Instructor: 'bg-amber-50 text-amber-700 border border-amber-100',
  TA: 'bg-sky-50 text-sky-700 border border-sky-100',
  default: 'bg-gray-50 text-gray-600 border border-gray-200',
}

const dots = {
  Booked: 'bg-blue-400',
  Cancelled: 'bg-red-400',
  Completed: 'bg-brand-500',
  active: 'bg-brand-500',
  cancelled: 'bg-red-400',
}

export default function Badge({ label, showDot = false, className = '' }) {
  const style = styles[label] || styles.default
  const dot = dots[label]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style} ${className}`}>
      {showDot && dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      )}
      {label}
    </span>
  )
}
