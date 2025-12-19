import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import DashboardSelect from "@/pages/DashboardSelect";
import Dashboard from "@/pages/Dashboard";
import DynamicContent from "@/pages/DynamicContent";
import Users from "@/pages/Users";
import UserDetail from "@/pages/UserDetail";
import { isAuthenticated } from "@/signals/auth";
import { useAuthInit } from "@/hooks/useAuthInit";

function App() {
  // Initialize auth state on app load (fetch user if token exists)
  useAuthInit();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated.value ? (
              <Navigate to="/select-dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated.value ? (
              <Navigate to="/select-dashboard" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route element={<ProtectedRoute />}>
          {/* Dashboard Selection Screen */}
          <Route path="/select-dashboard" element={<DashboardSelect />} />
          {/* Internal Metrics Dashboard */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Static routes for specific pages */}
            <Route path="/dashboard/users" element={<Users />} />
            <Route path="/dashboard/users/detail/:userId" element={<UserDetail />} />
            {/* Dynamic routes for sidebar items under /dashboard */}
            <Route path="/dashboard/*" element={<DynamicContent />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/select-dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
