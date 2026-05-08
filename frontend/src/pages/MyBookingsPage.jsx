import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { bookingAPI } from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const TABS = ['All', 'Booked', 'Completed', 'Cancelled']

export default function MyBookingsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { loadBookings() }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingAPI.getByStudent(user.user_id)
      setBookings(res.data || [])
    } catch {
      addToast('Failed to load bookings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelModal) return
    setCancelling(true)
    try {
      await bookingAPI.cancel(cancelModal.booking_id)
      addToast('Booking cancelled successfully', 'success')
      setCancelModal(null)
      loadBookings()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel booking', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const filtered = activeTab === 'All' ? bookings : bookings.filter(b => b.status === activeTab)

  const counts = TABS.slice(1).reduce((acc, tab) => {
    acc[tab] = bookings.filter(b => b.status === tab).length
    return acc
  }, {})

  if (loading) return <LoadingSpinner message="Loading your bookings..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage your office hour appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${activeTab === tab ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            {tab}
            {tab !== 'All' && counts[tab] > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === tab ? 'text-brand-600' : 'text-gray-400'}`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            }
            title={activeTab === 'All' ? 'No bookings yet' : `No ${activeTab.toLowerCase()} bookings`}
            description={activeTab === 'All' ? 'Browse available office hours to book your first appointment.' : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Card key={b.booking_id} padding={false}>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    b.status === 'Completed' ? 'bg-brand-50' :
                    b.status === 'Cancelled' ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    {b.status === 'Completed' && (
                      <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {b.status === 'Cancelled' && (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {b.status === 'Booked' && (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Appointment #{b.booking_id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Time Slot #{b.slot_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={b.status} showDot />
                  {b.status === 'Booked' && (
                    <Button variant="outline" size="xs" onClick={() => setCancelModal(b)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary chips */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-blue-700">{counts.Booked || 0}</p>
            <p className="text-xs text-blue-500 mt-0.5">Upcoming</p>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-brand-700">{counts.Completed || 0}</p>
            <p className="text-xs text-brand-500 mt-0.5">Completed</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-red-600">{counts.Cancelled || 0}</p>
            <p className="text-xs text-red-400 mt-0.5">Cancelled</p>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel Booking"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelModal(null)}>Keep Booking</Button>
            <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>Yes, Cancel</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm font-semibold text-red-800 mb-1">Appointment #{cancelModal?.booking_id}</p>
            <p className="text-xs text-red-600">Time Slot #{cancelModal?.slot_id}</p>
          </div>
          <p className="text-sm text-gray-500">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  )
}
