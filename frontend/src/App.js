import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApplicationRoutes from './components/ApplicationRoutes';
import Navbar from './components/Navbar';
import Sidebar from './components/layout/Sidebar';
import GuestBanner from './components/layout/GuestBanner';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { validateToken } from './store/slices/authSlice';
import { selectTokenValidated, selectAuthLoading, selectIsAuthenticated, selectUser } from './store/slices/authSlice';
import { store } from './store';

const GlobalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-ink"
      aria-label="Loading"
    />
  </div>
);

function App() {
  const dispatch = useDispatch();
  const tokenValidated = useSelector(selectTokenValidated);
  const authLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    window.store = store;
    console.log('🔧 Store made available globally for API interceptors');
  }, []);

  useEffect(() => {
    if (!tokenValidated) {
      console.log('🚀 Initializing authentication...');
      dispatch(validateToken());
    }
  }, [dispatch, tokenValidated]);

  if (!tokenValidated || authLoading) {
    return <GlobalLoader />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg text-ink">
        {isAuthenticated ? (
          <div className="min-h-screen">
            <Sidebar
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            <div className="flex min-h-screen min-w-0 flex-col md:ml-64">
              <Navbar
                onMenuClick={() => setMobileSidebarOpen(true)}
              />

              <GuestBanner isGuest={user?.isGuest} />

<main className="min-w-0 flex-1 bg-bg px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
  <div className="min-h-full overflow-hidden rounded-2xl bg-surface">
    <ApplicationRoutes />
  </div>
</main>

              <Footer />
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen flex-col">
            <Navbar
              onMenuClick={() => setMobileSidebarOpen(true)}
            />

            <main className="min-w-0 flex-1 pb-8">
              <ApplicationRoutes />
            </main>

            <Footer />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;