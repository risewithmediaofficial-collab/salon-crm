import React, { useState, useEffect } from 'react';
import reportService from '../reportService.js';
import Card from '../../../components/common/Card.jsx';
import Table from '../../../components/common/Table.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import { IndianRupee, TrendingUp, Award, Scissors, Users } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils/index.js';

export function AdminReportsPage() {
  const [revenueData, setRevenueData] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const [revRes, staffRes, topRes, custRes] = await Promise.all([
          reportService.getRevenue(),
          reportService.getStaffPerformance(),
          reportService.getTopServices(),
          reportService.getCustomerGrowth(),
        ]);

        setRevenueData(revRes.data);
        setStaffData(staffRes.data || []);
        setTopServices(topRes.data || []);
        setCustomerGrowth(custRes.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = revenueData?.summary || {};
  const paymentMethods = revenueData?.paymentMethods || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Salon Performance Reports</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Executive financial insights, stylist productivity metrics, and top requested treatments
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
            Total Revenue (30 Days)
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {formatCurrency(summary.totalRevenue || 0)}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">
            From {summary.totalInvoices || 0} completed invoices
          </span>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-white to-blue-50/40 border-blue-100">
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block mb-1">
            Average Ticket Size
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {formatCurrency(summary.averageBillValue || 0)}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Per client visit</span>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-white to-salon-50/40 border-salon-100">
          <span className="text-xs font-semibold text-salon-800 uppercase tracking-wider block mb-1">
            Total Client Base
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 block tabular-nums">
            {customerGrowth?.totalCustomers || 0}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">Registered salon patrons</span>
        </Card>
      </div>

      {/* Payment Method Distribution */}
      <Card className="p-6">
        <h3 className="text-base font-display font-bold text-stone-900 tracking-tight mb-4 pb-3 border-b border-stone-100">
          Payment Method Breakdown (Cash vs UPI vs Card)
        </h3>

        {!paymentMethods.length ? (
          <p className="text-xs text-stone-400 italic">No payment transactions recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {paymentMethods.map((pm) => (
              <div key={pm._id} className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-center">
                <span className="text-xs font-bold text-stone-800 uppercase block mb-1">
                  {pm._id}
                </span>
                <span className="text-base font-bold text-emerald-700 block tabular-nums">
                  {formatCurrency(pm.totalAmount)}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  {pm.transactionCount} transactions
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Staff Productivity & Top Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stylist Productivity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-display font-bold text-stone-900 tracking-tight">Stylist Performance</h3>
          </div>

          {!staffData.length ? (
            <p className="text-xs text-stone-400 italic">No bookings recorded for current period.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {staffData.map((st) => (
                <div key={st.staffId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Avatar src={st.avatarUrl} name={st.staffName} size="sm" />
                    <div>
                      <span className="font-bold text-stone-900 block">{st.staffName}</span>
                      <span className="text-stone-400 text-[11px]">
                        {st.completed} completed / {st.totalBookings} total
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block">
                      {Math.round(st.completionRate)}% Completion
                    </span>
                    {st.noShows > 0 && (
                      <span className="text-rose-500 text-[10px]">{st.noShows} no-shows</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Treatments */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
            <Scissors className="w-5 h-5 text-salon-700" />
            <h3 className="text-base font-display font-bold text-stone-900 tracking-tight">Top Revenue Treatments</h3>
          </div>

          {!topServices.length ? (
            <p className="text-xs text-stone-400 italic">No completed service records yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {topServices.map((svc) => (
                <div key={svc.serviceId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">{svc.serviceName}</span>
                    <span className="text-stone-400 text-[11px]">
                      {svc.category} &bull; {svc.bookingsCount} clients served
                    </span>
                  </div>

                  <span className="font-bold text-stone-900 text-sm tabular-nums">
                    {formatCurrency(svc.totalRevenue || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminReportsPage;
