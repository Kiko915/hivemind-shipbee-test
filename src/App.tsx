import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import ChatWidget from '@/components/chat/ChatWidget'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminGuard from '@/components/admin/AdminGuard'
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTickets from './pages/admin/AdminTickets'
import AdminTicketDetail from './pages/admin/AdminTicketDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
            {/* Future routes: users, settings */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster richColors position="top-center" toastOptions={{ style: { zIndex: 99999 } }} />
      <ChatWidget />
    </BrowserRouter>
  )
}

export default App
