import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Lazy loading the heavy admin and public components
const Layout = lazy(() => import('@/components/Layout'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Leads = lazy(() => import('@/pages/Leads'));
const Pipeline = lazy(() => import('@/pages/Pipeline'));
const WeddingDetail = lazy(() => import('@/pages/WeddingDetail'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const Stats = lazy(() => import('@/pages/Stats'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const LeadForm = lazy(() => import('@/pages/LeadForm'));
const ClientPortal = lazy(() => import('@/pages/ClientPortal'));
const GuestArea = lazy(() => import('@/pages/GuestArea'));

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingSpinner />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/solicitud" element={<LeadForm />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/invitados/:token" element={<GuestArea />} />
        
        {/* Admin Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/boda/:id" element={<WeddingDetail />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/estadisticas" element={<Stats />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App;