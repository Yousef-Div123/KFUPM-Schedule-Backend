export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
