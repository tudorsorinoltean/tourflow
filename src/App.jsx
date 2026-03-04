import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PackagesPage from "./pages/admin/PackagesPage";
import BookingsPage from "./pages/admin/BookingsPage";
import PublicPackagesPage from "./pages/public/PublicPackagesPage";
import BookingFormPage from "./pages/public/BookingFormPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicPackagesPage />} />
        <Route path="/packages/:id" element={<PublicPackagesPage />} />
        <Route path="/book/:id" element={<BookingFormPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/admin/packages" element={<PrivateRoute><PackagesPage /></PrivateRoute>} />
        <Route path="/admin/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}