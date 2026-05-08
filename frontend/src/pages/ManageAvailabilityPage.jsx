import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  scheduleAPI, officeHourAPI, timeSlotAPI,
  instructorCourseAPI, courseAPI
} from '../services/api'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { Select } from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { format, parseISO } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ManageAvailabilityPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [schedules, setSchedules] = useState([])
  const [expandedSchedule, setExpandedSchedule] = useState(null)
  const [officeHours, setOfficeHours] = useState({})
  const [timeSlots, setTimeSlots] = useState({})

  // Modals
  const [scheduleModal, setScheduleModal] = useState(false)
  const [ohModal, setOhModal] = useState(null)
  const [slotModal, setSlotModal] = useState(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [scheduleForm, setScheduleForm] = useState({
    course_id: '', day_of_week: 'Monday',
    start_time: '09:00', end_time: '10:00',
    start_date: '', end_date: '',
  })
  const [ohForm, setOhForm] = useState({ date: '' })
  const [slotForm, setSlotForm] = useState({ start_time: '09:00', end_time: '09:30', capacity: '1' })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [icRes, schedRes] = await Promise.all([
        instructorCourseAPI.getByInstructor(user.user_id),
        scheduleAPI.getByInstructor(user.user_id),
      ])
      const instructorCourses = icRes.data || []
      if (instructorCourses.length > 0) {
        const courseIds = instructorCourses.map(ic => ic.course_id)
        const allCourses = await courseAPI.getAll()
        setCourses((allCourses.data || []).filter(c => courseIds.includes(c.course_id)))
      }
      setSchedules(schedRes.data || [])
    } catch {
      addToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadOfficeHours = async (scheduleId) => {
    try {
      const res = await officeHourAPI.getBySchedule(scheduleId)
      setOfficeHours(prev => ({ ...prev, [scheduleId]: res.data || [] }))
    } catch {}
  }

  const loadTimeSlots = async (officeHourId) => {
    try {
      const res = await timeSlotAPI.getByOfficeHour(officeHourId)
      setTimeSlots(prev => ({ ...prev, [officeHourId]: res.data || [] }))
    } catch {}
  }

  const toggleSchedule = async (scheduleId) => {
    if (expandedSchedule === scheduleId) {
      setExpandedSchedule(null)
    } else {
      setExpandedSchedule(scheduleId)
      if (!officeHours[scheduleId]) {
        await loadOfficeHours(scheduleId)
      }
    }
  }

  const handleToggleOfficeHour = async (ohId) => {
    if (!timeSlots[ohId]) {
      await loadTimeSlots(ohId)
    }
  }

  const validateScheduleForm = () => {
    const e = {}
    if (!scheduleForm.course_id) e.course_id = 'Please select a course'
    if (!scheduleForm.start_date) e.start_date = 'Start date is required'
    if (!scheduleForm.end_date) e.end_date = 'End date is required'
    if (scheduleForm.start_date && scheduleForm.end_date && scheduleForm.end_date <= scheduleForm.start_date) {
      e.end_date = 'End date must be after start date'
    }
    return e
  }

  const handleCreateSchedule = async e => {
    e.preventDefault()
    const errors = validateScheduleForm()
    if (Object.keys(errors).length) { setFormErrors(errors); return }
    setSaving(true)
    try {
      await scheduleAPI.create({
        instructor_id: user.user_id,
        course_id: parseInt(scheduleForm.course_id),
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        start_date: scheduleForm.start_date,
        end_date: scheduleForm.end_date,
      })
      addToast('Schedule created successfully!', 'success')
      setScheduleModal(false)
      setScheduleForm({ course_id: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', start_date: '', end_date: '' })
      setFormErrors({})
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Delete this schedule? This will also remove associated office hours.')) return
    try {
      await scheduleAPI.delete(scheduleId)
      addToast('Schedule deleted', 'success')
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete', 'error')
    }
  }

  const handleCreateOfficeHour = async e => {
    e.preventDefault()
    if (!ohForm.date) { setFormErrors({ date: 'Date is required' }); return }
    setSaving(true)
    try {
      await officeHourAPI.create({ schedule_id: ohModal, date: ohForm.date, status: 'active' })
      addToast('Office hour session created!', 'success')
      setOhModal(null)
      setOhForm({ date: '' })
      setFormErrors({})
      await loadOfficeHours(ohModal)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create office hour', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelOfficeHour = async (ohId, scheduleId) => {
    if (!confirm('Cancel this office hour session?')) return
    try {
      await officeHourAPI.cancel(ohId)
      addToast('Session cancelled', 'success')
      await loadOfficeHours(scheduleId)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel', 'error')
    }
  }

  const handleCreateSlot = async e => {
    e.preventDefault()
    const errors = {}
    if (!slotForm.start_time) errors.start_time = 'Required'
    if (!slotForm.end_time) errors.end_time = 'Required'
    if (Object.keys(errors).length) { setFormErrors(errors); return }
    setSaving(true)
    try {
      await timeSlotAPI.create({
        office_hour_id: slotModal,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        capacity: parseInt(slotForm.capacity) || 1,
      })
      addToast('Time slot added!', 'success')
      setSlotModal(null)
      setSlotForm({ start_time: '09:00', end_time: '09:30', capacity: '1' })
      setFormErrors({})
      await loadTimeSlots(slotModal)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create slot', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId, ohId) => {
    if (!confirm('Delete this time slot?')) return
    try {
      await timeSlotAPI.delete(slotId)
      addToast('Slot deleted', 'success')
      await loadTimeSlots(ohId)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete slot', 'error')
    }
  }

  const getCourse = id => courses.find(c => c.course_id === id)

  if (loading) return <LoadingSpinner message="Loading your schedules..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your office hour schedules</p>
        </div>
        <Button onClick={() => setScheduleModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <EmptyState
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="No schedules yet"
            description="Create your first office hour schedule to let students book appointments."
            action={<Button size="sm" onClick={() => setScheduleModal(true)}>Create Schedule</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map(s => {
            const course = getCourse(s.course_id)
            const isExpanded = expandedSchedule === s.schedule_id
            const hours = officeHours[s.schedule_id] || []

            return (
              <Card key={s.schedule_id} padding={false}>
                {/* Schedule Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
                  onClick={() => toggleSchedule(s.schedule_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {s.day_of_week} · {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {course ? `${course.course_code} – ${course.course_name}` : `Course #${s.course_id}`}
                        {' · '}{s.start_date} to {s.end_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={e => { e.stopPropagation(); handleDeleteSchedule(s.schedule_id) }}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded: Office Hours */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Office Hour Sessions</p>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => { setOhModal(s.schedule_id); setFormErrors({}) }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Session
                      </Button>
                    </div>

                    {hours.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No sessions yet. Add your first session.</p>
                    ) : (
                      <div className="space-y-3">
                        {hours.map(oh => {
                          const slots = timeSlots[oh.office_hour_id]
                          return (
                            <div key={oh.office_hour_id} className="border border-gray-100 rounded-xl overflow-hidden">
                              {/* Office Hour Row */}
                              <div
                                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleToggleOfficeHour(oh.office_hour_id)}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Badge label={oh.status} showDot />
                                  <span className="text-sm font-medium text-gray-700">
                                    {format(parseISO(oh.date), 'EEEE, MMMM d, yyyy')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {oh.status === 'active' && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={e => { e.stopPropagation(); handleCancelOfficeHour(oh.office_hour_id, s.schedule_id) }}
                                    >
                                      <span className="text-xs text-red-400">Cancel</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="secondary"
                                    size="xs"
                                    onClick={e => { e.stopPropagation(); setSlotModal(oh.office_hour_id); setFormErrors({}) }}
                                  >
                                    + Slot
                                  </Button>
                                </div>
                              </div>

                              {/* Time Slots */}
                              {slots && (
                                <div className="px-4 py-3">
                                  {slots.length === 0 ? (
                                    <p className="text-xs text-gray-400">No time slots. Click "+ Slot" to add one.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {slots.map(slot => (
                                        <div
                                          key={slot.slot_id}
                                          className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg"
                                        >
                                          <span className="text-xs font-medium text-brand-700">
                                            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                          </span>
                                          <span className="text-xs text-brand-400">·</span>
                                          <span className="text-xs text-brand-500">Cap: {slot.capacity}</span>
                                          <button
                                            onClick={() => handleDeleteSlot(slot.slot_id, oh.office_hour_id)}
                                            className="text-brand-300 hover:text-red-400 transition-colors ml-1"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Modal
        open={scheduleModal}
        onClose={() => { setScheduleModal(false); setFormErrors({}) }}
        title="Create Office Hour Schedule"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setScheduleModal(false); setFormErrors({}) }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateSchedule}>Create Schedule</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <Select
            label="Course"
            id="course_id"
            value={scheduleForm.course_id}
            onChange={e => { setScheduleForm(f => ({ ...f, course_id: e.target.value })); setFormErrors(er => ({ ...er, course_id: '' })) }}
            error={formErrors.course_id}
          >
            <option value="">Select a course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} – {c.course_name}
              </option>
            ))}
          </Select>
          <Select
            label="Day of Week"
            id="day_of_week"
            value={scheduleForm.day_of_week}
            onChange={e => setScheduleForm(f => ({ ...f, day_of_week: e.target.value }))}
          >
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              id="start_time"
              type="time"
              value={scheduleForm.start_time}
              onChange={e => setScheduleForm(f => ({ ...f, start_time: e.target.value }))}
            />
            <Input
              label="End Time"
              id="end_time"
              type="time"
              value={scheduleForm.end_time}
              onChange={e => setScheduleForm(f => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              id="start_date"
              type="date"
              value={scheduleForm.start_date}
              onChange={e => { setScheduleForm(f => ({ ...f, start_date: e.target.value })); setFormErrors(er => ({ ...er, start_date: '' })) }}
              error={formErrors.start_date}
            />
            <Input
              label="End Date"
              id="end_date"
              type="date"
              value={scheduleForm.end_date}
              onChange={e => { setScheduleForm(f => ({ ...f, end_date: e.target.value })); setFormErrors(er => ({ ...er, end_date: '' })) }}
              error={formErrors.end_date}
            />
          </div>
        </form>
      </Modal>

      {/* Create Office Hour Modal */}
      <Modal
        open={!!ohModal}
        onClose={() => { setOhModal(null); setFormErrors({}) }}
        title="Add Office Hour Session"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setOhModal(null); setFormErrors({}) }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateOfficeHour}>Add Session</Button>
          </>
        }
      >
        <form onSubmit={handleCreateOfficeHour} className="space-y-4">
          <Input
            label="Session Date"
            id="oh_date"
            type="date"
            value={ohForm.date}
            onChange={e => { setOhForm(f => ({ ...f, date: e.target.value })); setFormErrors(er => ({ ...er, date: '' })) }}
            error={formErrors.date}
            hint="Pick the specific date for this office hour session"
          />
        </form>
      </Modal>

      {/* Add Time Slot Modal */}
      <Modal
        open={!!slotModal}
        onClose={() => { setSlotModal(null); setFormErrors({}) }}
        title="Add Time Slot"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setSlotModal(null); setFormErrors({}) }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateSlot}>Add Slot</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              id="slot_start"
              type="time"
              value={slotForm.start_time}
              onChange={e => { setSlotForm(f => ({ ...f, start_time: e.target.value })); setFormErrors(er => ({ ...er, start_time: '' })) }}
              error={formErrors.start_time}
            />
            <Input
              label="End Time"
              id="slot_end"
              type="time"
              value={slotForm.end_time}
              onChange={e => { setSlotForm(f => ({ ...f, end_time: e.target.value })); setFormErrors(er => ({ ...er, end_time: '' })) }}
              error={formErrors.end_time}
            />
          </div>
          <Input
            label="Capacity"
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={slotForm.capacity}
            onChange={e => setSlotForm(f => ({ ...f, capacity: e.target.value }))}
            hint="Maximum number of students per slot"
          />
        </form>
      </Modal>
    </div>
  )
}
