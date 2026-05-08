import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { scheduleAPI, officeHourAPI, timeSlotAPI, bookingAPI, courseAPI, instructorCourseAPI } from '../services/api'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Select } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'

export default function AttendancePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [sessions, setSessions] = useState([])
  const [completing, setCompleting] = useState({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [icRes, schedRes] = await Promise.all([
        instructorCourseAPI.getByInstructor(user.user_id),
        scheduleAPI.getByInstructor(user.user_id),
      ])
      const instructorCourses = icRes.data || []
      const schedules = schedRes.data || []

      if (instructorCourses.length > 0) {
        const courseIds = instructorCourses.map(ic => ic.course_id)
        const allCourses = await courseAPI.getAll()
        setCourses((allCourses.data || []).filter(c => courseIds.includes(c.course_id)))
      }

      const allSessions = []
      for (const s of schedules) {
        const ohRes = await officeHourAPI.getBySchedule(s.schedule_id)
        const hours = ohRes.data || []
        for (const oh of hours) {
          const slotRes = await timeSlotAPI.getByOfficeHour(oh.office_hour_id)
          const slots = slotRes.data || []
          for (const slot of slots) {
            const bookRes = await bookingAPI.getBySlot(slot.slot_id)
            const bookings = bookRes.data || []
            if (bookings.length > 0) {
              allSessions.push({
                officeHour: oh,
                schedule: s,
                slot,
                bookings,
              })
            }
          }
        }
      }
      setSessions(allSessions)
    } catch (err) {
      addToast('Failed to load attendance data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (bookingId) => {
    setCompleting(prev => ({ ...prev, [bookingId]: true }))
    try {
      await bookingAPI.complete(bookingId)
      addToast('Attendance marked as completed', 'success')
      setSessions(prev =>
        prev.map(s => ({
          ...s,
          bookings: s.bookings.map(b =>
            b.booking_id === bookingId ? { ...b, status: 'Completed' } : b
          ),
        }))
      )
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to mark complete', 'error')
    } finally {
      setCompleting(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  const getCourse = id => courses.find(c => c.course_id === id)

  const filteredSessions = selectedCourse === 'all'
    ? sessions
    : sessions.filter(s => s.schedule.course_id === parseInt(selectedCourse))

  const totalBookings = filteredSessions.reduce((sum, s) => sum + s.bookings.length, 0)
  const completedBookings = filteredSessions.reduce(
    (sum, s) => sum + s.bookings.filter(b => b.status === 'Completed').length, 0
  )

  if (loading) return <LoadingSpinner message="Loading attendance data..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage student bookings for your office hours</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Appointments</p>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-700">{completedBookings}</p>
            <p className="text-sm text-brand-500 mt-0.5">Attended</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">{totalBookings - completedBookings}</p>
            <p className="text-sm text-blue-500 mt-0.5">Pending</p>
          </div>
        </div>
      )}

      {/* Course Filter */}
      {courses.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 shrink-0">Filter by course:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourse('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCourse === 'all'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-brand-50'
              }`}
            >
              All Courses
            </button>
            {courses.map(c => (
              <button
                key={c.course_id}
                onClick={() => setSelectedCourse(c.course_id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCourse === c.course_id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-brand-50'
                }`}
              >
                {c.course_code}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="No bookings yet"
            description="Bookings will appear here once students start booking your office hours."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session, idx) => {
            const course = getCourse(session.schedule.course_id)
            return (
              <Card key={`${session.slot.slot_id}-${idx}`} padding={false}>
                {/* Session Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {format(parseISO(session.officeHour.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {session.slot.start_time?.slice(0, 5)} – {session.slot.end_time?.slice(0, 5)}
                        {course && ` · ${course.course_code} – ${course.course_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={session.officeHour.status} showDot />
                      <span className="text-xs text-gray-400">
                        {session.bookings.filter(b => b.status !== 'Cancelled').length}/{session.slot.capacity} booked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bookings Table */}
                <div className="divide-y divide-gray-50">
                  {session.bookings.map(booking => (
                    <div key={booking.booking_id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Student #{booking.student_id}</p>
                          <p className="text-xs text-gray-400">Booking #{booking.booking_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge label={booking.status} showDot />
                        {booking.status === 'Booked' && (
                          <Button
                            size="xs"
                            loading={completing[booking.booking_id]}
                            onClick={() => handleComplete(booking.booking_id)}
                          >
                            Mark Attended
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
