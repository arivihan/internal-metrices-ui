import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import DashboardSelect from "@/pages/dashboard-select";
import Dashboard from "@/pages/dashboard";
import DynamicContent from "@/pages/DynamicContent";
import Users from "@/pages/users";
import UserDetail from "@/pages/users/UserDetail";
import Notifications from "@/pages/Notifications";
import ASATScorecards from "@/pages/asat";
import SqlPlayground from "@/pages/sql-playground";
import CreateQuery from "@/pages/sql-playground/create";
import AppConfigs from "@/pages/app-configs";
import DasboardUIConfig from "@/pages/dashboard-ui-config";
import Chapters from "@/pages/chapters";
import RBAC from "@/pages/rbac";
import { isAuthenticated } from "@/signals/auth";
import { useAuthInit } from "@/hooks/useAuthInit";
import { Toaster } from "@/components/ui/sonner";
import NotesUploadPage from "./pages/notes-upload";
import ViralVideosPage from "./pages/viral-videos";
import ServiceStatusPage from "@/pages/service-status";

function App() {
  // Initialize auth state on app load (fetch user if token exists)
  useAuthInit();
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
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

          <Route path="/service-status" element={<ServiceStatusPage />} />
          {/* Internal Metrics Dashboard */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Static routes for specific pages */}
            <Route path="/dashboard/users" element={<Users />} />
            <Route
              path="/dashboard/users/detail/:userId"
              element={<UserDetail />}
            />
            <Route
              path="/dashboard/notifications"
              element={<Notifications />}
            />
            <Route
              path="/dashboard/asat-scorecards"
              element={<ASATScorecards />}
            />
            <Route
              path="/dashboard/sql-playground"
              element={<SqlPlayground />}
            />
            <Route
              path="/dashboard/sql-playground/create"
              element={<CreateQuery />}
            />
            <Route path="/dashboard/app-configs" element={<AppConfigs />} />
            <Route
              path="/dashboard/dashboard-ui-configs"
              element={<DasboardUIConfig />}
            />

            <Route path="/dashboard/chapters" element={<Chapters />} />
            <Route path="/dashboard/notes" element={<NotesUploadPage />} />
            <Route
              path="/dashboard/viral-videos"
              element={<ViralVideosPage />}
            />
            <Route path="/dashboard/rbac" element={<RBAC />} />


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
