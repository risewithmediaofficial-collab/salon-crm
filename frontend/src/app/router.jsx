import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

// Direct import for high-traffic customer home and booking wizard
import HomePage from '../features/home/HomePage.jsx';
import BookingWizardPage from '../features/appointments/pages/BookingWizardPage.jsx';
import StaffLoginPage from '../features/auth/pages/StaffLoginPage.jsx';
import RouteErrorPage from '../components/common/RouteErrorPage.jsx';
import NotFoundPage from '../components/common/NotFoundPage.jsx';

// Lazy loading for large modules (Section 21)
const ServicesPage = lazy(() => import('../features/services/pages/ServicesPage.jsx'));
const StaffPage = lazy(() => import('../features/staff/pages/StaffPage.jsx'));
const OffersPage = lazy(() => import('../features/offers/pages/OffersPage.jsx'));
const MyAppointmentsPage = lazy(() => import('../features/appointments/pages/MyAppointmentsPage.jsx'));
const CustomerProfilePage = lazy(() => import('../features/customers/pages/CustomerProfilePage.jsx'));

// Admin lazy modules
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage.jsx'));
const AdminAppointmentsPage = lazy(() => import('../features/appointments/pages/AdminAppointmentsPage.jsx'));
const CalendarPage = lazy(() => import('../features/calendar/pages/CalendarPage.jsx'));
const AdminCustomersPage = lazy(() => import('../features/customers/pages/AdminCustomersPage.jsx'));
const AdminServicesPage = lazy(() => import('../features/services/pages/AdminServicesPage.jsx'));
const AdminStaffPage = lazy(() => import('../features/staff/pages/AdminStaffPage.jsx'));
const AdminBillingPage = lazy(() => import('../features/billing/pages/AdminBillingPage.jsx'));
const AdminPosPage = lazy(() => import('../features/billing/pages/AdminPosPage.jsx'));
const AdminOffersPage = lazy(() => import('../features/offers/pages/AdminOffersPage.jsx'));
const AdminReportsPage = lazy(() => import('../features/reports/pages/AdminReportsPage.jsx'));
const AdminAuditPage = lazy(() => import('../features/audit/pages/AdminAuditPage.jsx'));

function SuspenseFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <LoadingSpinner size="lg" className="text-salon-800 mx-auto mb-3" />
      <span className="text-xs text-stone-500 font-medium">Loading luxury experience...</span>
    </div>
  );
}

export const router = createBrowserRouter([
  // Customer Portal
  {
    path: '/',
    element: <CustomerLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'services',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ServicesPage />
          </Suspense>
        ),
      },
      {
        path: 'staff',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <StaffPage />
          </Suspense>
        ),
      },
      {
        path: 'offers',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <OffersPage />
          </Suspense>
        ),
      },
      {
        path: 'book',
        element: <BookingWizardPage />,
      },
      {
        path: 'my-appointments',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MyAppointmentsPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <CustomerProfilePage />
          </Suspense>
        ),
      },
    ],
  },

  // Staff Login (supports /staff-login, /staff/login, and /login)
  {
    path: '/staff-login',
    element: <StaffLoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/staff/login',
    element: <StaffLoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/login',
    element: <StaffLoginPage />,
    errorElement: <RouteErrorPage />,
  },

  // Salon Admin Portal
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'appointments',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminAppointmentsPage />
          </Suspense>
        ),
      },
      {
        path: 'calendar',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminCustomersPage />
          </Suspense>
        ),
      },
      {
        path: 'services',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminServicesPage />
          </Suspense>
        ),
      },
      {
        path: 'staff',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminStaffPage />
          </Suspense>
        ),
      },
      {
        path: 'billing',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminBillingPage />
          </Suspense>
        ),
      },
      {
        path: 'pos',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminPosPage />
          </Suspense>
        ),
      },
      {
        path: 'offers',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminOffersPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'audit',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminAuditPage />
          </Suspense>
        ),
      },
    ],
  },

  // Global 404 Catch-All Route
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorPage />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
