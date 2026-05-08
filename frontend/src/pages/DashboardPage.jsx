import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  enrollmentAPI, bookingAPI, scheduleAPI, officeHourAPI,
  instructorCourseAPI, courseAPI
} from '../services/api'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format, isAfter, parseISO } from 'date-fns'

function StatCard({ label, value, icon, color = 'brand', sub }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentBookings, setRecentBookings] = useState([])
  const [upcomingHours, setUpcomingHours] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (user.role === 'Student') {
        const [enrollRes, bookingRes] = await Promise.all([
          enrollmentAPI.getByStudent(user.user_id),
          bookingAPI.getByStudent(user.user_id),
        ])
        const bookings = bookingRes.data || []
        const upcoming = bookings.filter(b => b.status === 'Booked')
        setStats({
          enrolledCourses: enrollRes.data?.length || 0,
          totalBookings: bookings.length,
          upcomingCount: upcoming.length,
          completedCount: bookings.filter(b => b.status === 'Completed').length,
        })
        setRecentBookings(bookings.slice(0, 5))
      } else {
        const [courseRes, scheduleRes] = await Promise.all([
          instructorCourseAPI.getByInstructor(user.user_id),
          scheduleAPI.getByInstructor(user.user_id),
        ])
        const schedules = scheduleRes.data || []
        const today = new Date().toISOString().split('T')[0]
        const upcoming = []
        for (const s of schedules.slice(0, 3)) {
          try {
            const ohRes = await officeHourAPI.getBySchedule(s.schedule_id)
            const active = (ohRes.data || []).filter(
              oh => oh.status === 'active' && oh.date >= today
            )
            upcoming.push(...active.slice(0, 2))
          } catch {}
        }
        setStats({
          teachingCourses: courseRes.data?.length || 0,
          activeSchedules: schedules.length,
          upcomingHoursCount: upcoming.length,
        })
        setUpcomingHours(upcoming.slice(0, 4))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      {user.role === 'Student' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Enrolled Courses"
            value={stats.enrolledCourses}
            color="brand"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <StatCard
            label="Upcoming Bookings"
            value={stats.upcomingCount}
            color="blue"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            label="Total Bookings"
            value={stats.totalBookings}
            color="purple"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
          />
          <StatCard
            label="Completed"
            value={stats.completedCount}
            color="amber"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Courses Teaching"
            value={stats.teachingCourses}
            color="brand"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <StatCard
            label="Active Schedules"
            value={stats.activeSchedules}
            color="blue"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Upcoming Sessions"
            value={stats.upcomingHoursCount}
            color="amber"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          {user.role === 'Student' ? (
            <>
              <Link to="/browse">
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse Office Hours
                </Button>
              </Link>
              <Link to="/bookings">
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  My Bookings
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/availability">
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Schedule
                </Button>
              </Link>
              <Link to="/attendance">
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Attendance
                </Button>
              </Link>
            </>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      {user.role === 'Student' && recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <Link to="/bookings" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {recentBookings.map(b => (
              <div key={b.booking_id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">Booking #{b.booking_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Slot #{b.slot_id}</p>
                </div>
                <Badge label={b.status} showDot />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming office hours for instructor */}
      {user.role !== 'Student' && upcomingHours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Office Hours</CardTitle>
            <Link to="/availability" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Manage
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {upcomingHours.map(oh => (
              <div key={oh.office_hour_id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {oh.date ? format(parseISO(oh.date), 'EEEE, MMM d, yyyy') : `Date: ${oh.date}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Schedule #{oh.schedule_id}</p>
                </div>
                <Badge label={oh.status} showDot />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
