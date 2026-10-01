import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '@/services/dashboardService.js';
import Card from '@/components/common/Card.jsx';
import Button from '@/components/common/Button.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import Avatar from '@/components/common/Avatar.jsx';
import Skeleton from '@/components/common/Skeleton.jsx';
import {
  Calendar,
  Clock,
  IndianRupee,
  Users,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatTime12Hour } from '@shared/utils/index.js';

export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-stone-200">
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const today = stats?.today || {};

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Salon Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Today's real-time salon appointments, arrivals, revenue, and stylist schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/appointments">
            <Button variant="secondary" size="sm" icon={Calendar}>
              All Appointments
            </Button>
          </Link>
          <Link to="/admin/billing">
            <Button variant="primary" size="sm" icon={IndianRupee}>
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card className="p-5 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {formatCurrency(today.revenue || 0)}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Paid in salon today</span>
        </Card>

        {/* Pending Approval */}
        <Card className="p-5 bg-gradient-to-br from-white to-amber-50/30 border-amber-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending Actions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-900 block tabular-nums">
            {today.pending || 0}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Awaiting confirmation</span>
        </Card>

        {/* Today's Appointments */}
        <Card className="p-5 bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Today's Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {today.total || 0}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {today.completed || 0} completed &bull; {today.confirmed || 0} confirmed
          </span>
        </Card>

        {/* Active Stylists */}
        <Card className="p-5 bg-gradient-to-br from-white to-salon-50/30 border-salon-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-salon-800 uppercase tracking-wider">
              Staff on Duty
            </span>
            <div className="w-8 h-8 rounded-xl bg-salon-100 text-salon-700 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {stats?.activeStaff || 0}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Ready for clients</span>
        </Card>
      </div>

      {/* Main Section: Upcoming Appointments & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments Table */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-display font-bold text-stone-900 tracking-tight">
                Upcoming Schedule
              </h3>
              <p className="text-xs text-stone-500">Appointments scheduled for today</p>
            </div>
            <Link
              to="/admin/appointments"
              className="text-xs font-semibold text-salon-800 hover:text-salon-950 flex items-center gap-1 group"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {!stats?.upcoming?.length ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No upcoming appointments currently pending or confirmed.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {stats.upcoming.map((apt) => (
                <div key={apt._id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex flex-col items-center justify-center text-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span className="text-[10px] font-bold text-stone-800">
                        {formatTime12Hour(apt.startTime).split(' ')[0]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {apt.customer?.name || 'Walk-in Guest'}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">
                        {apt.service?.name} &bull; {apt.staff?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={apt.status} />
                    <Link to={`/admin/appointments`}>
                      <Button variant="secondary" size="sm" className="text-xs px-2.5 py-1">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Operations Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-display font-bold text-stone-900 tracking-tight mb-4 pb-3 border-b border-stone-100">
              Reception Shortcuts
            </h3>

            <div className="space-y-2.5">
              <Link to="/book" target="_blank" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs font-medium" icon={Calendar}>
                  Walk-In Client Booking
                </Button>
              </Link>

              <Link to="/admin/customers" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs font-medium" icon={Users}>
                  Find or Register Customer
                </Button>
              </Link>

              <Link to="/admin/billing" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs font-medium" icon={IndianRupee}>
                  Invoices & Payment Log
                </Button>
              </Link>

              <Link to="/admin/calendar" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs font-medium" icon={Clock}>
                  Full Salon Day Calendar
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Notice */}
          <Card className="p-5 bg-salon-50/50 border-salon-200">
            <h4 className="text-xs font-bold text-salon-900 uppercase tracking-wider mb-1">
              Salon Working Hours
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Standard shifts run 09:00 AM to 08:00 PM. All automated appointment SMS reminders are sent 1-2 hours prior to scheduled slot.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
