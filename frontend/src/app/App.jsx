import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ErrorBoundary>
  );
}

export default App;
