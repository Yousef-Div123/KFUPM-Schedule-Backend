import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  enrollmentAPI, courseAPI, scheduleAPI,
  officeHourAPI, timeSlotAPI, bookingAPI, instructorCourseAPI
} from '../services/api'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Select } from '../components/ui/Input'
import { format, parseISO } from 'date-fns'

export default function BrowseOfficeHoursPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [officeHourGroups, setOfficeHourGroups] = useState([])
  const [bookingModal, setBookingModal] = useState(null)
  const [booking, setBooking] = useState(false)
  const [myBookings, setMyBookings] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [enrollRes, bookingRes] = await Promise.all([
        enrollmentAPI.getByStudent(user.user_id),
        bookingAPI.getByStudent(user.user_id),
      ])
      const enrollments = enrollRes.data || []
      setMyBookings(bookingRes.data || [])

      if (!enrollments.length) { setLoading(false); return }

      const courseIds = enrollments.map(e => e.course_id)
      const today = new Date().toISOString().split('T')[0]

      const allCourses = await courseAPI.getAll()
      const enrolledCourses = (allCourses.data || []).filter(c => courseIds.includes(c.course_id))
      setCourses(enrolledCourses)

      const groups = []
      for (const course of enrolledCourses) {
        const schedulesRes = await scheduleAPI.getByCourse(course.course_id)
        const schedules = schedulesRes.data || []
        if (!schedules.length) continue

        const courseGroup = { course, sessions: [] }

        for (const schedule of schedules) {
          const ohRes = await officeHourAPI.getBySchedule(schedule.schedule_id)
          const activeHours = (ohRes.data || []).filter(
            oh => oh.status === 'active' && oh.date >= today
          )
          for (const oh of activeHours) {
            const slotRes = await timeSlotAPI.getByOfficeHour(oh.office_hour_id)
            const slots = slotRes.data || []
            if (slots.length > 0) {
              courseGroup.sessions.push({ officeHour: oh, schedule, slots })
            }
          }
        }
        if (courseGroup.sessions.length > 0) {
          groups.push(courseGroup)
        }
      }
      setOfficeHourGroups(groups)
    } catch (err) {
      addToast('Failed to load office hours', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (slotId) => {
    setBooking(true)
    try {
      const alreadyBooked = myBookings.some(
        b => b.slot_id === slotId && b.status === 'Booked'
      )
      if (alreadyBooked) {
        addToast('You already have an active booking for this slot', 'info')
        setBookingModal(null)
        return
      }
      await bookingAPI.book({ student_id: user.user_id, slot_id: slotId })
      addToast('Appointment booked successfully!', 'success')
      setBookingModal(null)
      loadData()
    } catch (err) {
      const msg = err.response?.data?.error || 'Booking failed. Please try again.'
      addToast(msg, 'error')
    } finally {
      setBooking(false)
    }
  }

  const isSlotBooked = (slotId) =>
    myBookings.some(b => b.slot_id === slotId && b.status === 'Booked')

  const filteredGroups = selectedCourse === 'all'
    ? officeHourGroups
    : officeHourGroups.filter(g => g.course.course_id === parseInt(selectedCourse))

  if (loading) return <LoadingSpinner message="Loading available office hours..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Office Hours</h1>
          <p className="text-sm text-gray-500 mt-1">Available sessions for your enrolled courses</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Filter */}
      {courses.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 shrink-0">Filter by course:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourse('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCourse === 'all'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-brand-50 hover:border-brand-200'
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
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-brand-50 hover:border-brand-200'
                }`}
              >
                {c.course_code}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            title="No office hours available"
            description="No upcoming office hours found for your enrolled courses."
          />
        </Card>
      ) : (
        filteredGroups.map(group => (
          <div key={group.course.course_id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <h2 className="text-sm font-semibold text-gray-700">
                {group.course.course_name}
                <span className="ml-2 text-xs font-normal text-gray-400">({group.course.course_code})</span>
              </h2>
            </div>

            {group.sessions.map(session => (
              <Card key={session.officeHour.office_hour_id} padding={false}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {format(parseISO(session.officeHour.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {session.slots.length} time slot{session.slots.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <Badge label={session.officeHour.status} showDot />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {session.slots.map(slot => {
                      const booked = isSlotBooked(slot.slot_id)
                      return (
                        <button
                          key={slot.slot_id}
                          onClick={() => !booked && setBookingModal({ slot, session })}
                          disabled={booked}
                          className={`
                            p-3 rounded-lg border text-left transition-all duration-150
                            ${booked
                              ? 'bg-brand-50 border-brand-200 cursor-default'
                              : 'bg-white border-gray-200 hover:border-brand-300 hover:bg-brand-50 cursor-pointer'
                            }
                          `}
                        >
                          <p className="text-xs font-semibold text-gray-800">
                            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Cap: {slot.capacity}</p>
                          {booked && (
                            <span className="text-xs font-medium text-brand-600 mt-1 block">Booked</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))
      )}

      {/* Booking Confirmation Modal */}
      {bookingModal && (
        <Modal
          open={!!bookingModal}
          onClose={() => setBookingModal(null)}
          title="Confirm Booking"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setBookingModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={booking}
                onClick={() => handleBook(bookingModal.slot.slot_id)}
              >
                Confirm Booking
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-sm font-semibold text-brand-800 mb-2">Appointment Details</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium">{format(parseISO(bookingModal.session.officeHour.date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span className="font-medium">
                    {bookingModal.slot.start_time?.slice(0, 5)} – {bookingModal.slot.end_time?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Capacity</span>
                  <span className="font-medium">{bookingModal.slot.capacity} student(s)</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Are you sure you want to book this time slot? You can cancel it later from My Bookings.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
