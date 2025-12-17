import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { isAuthenticated } from '@/signals/auth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/login'
          element={
            isAuthenticated.value ? <Navigate to='/dashboard' replace /> : <Login />
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path='/dashboard' element={<Dashboard />} />
          </Route>
        </Route>
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
