import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import ChatWidget from '@/components/chat/ChatWidget'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Toaster richColors position="top-center" toastOptions={{ style: { zIndex: 99999 } }} />
      <ChatWidget />
    </BrowserRouter>
  )
}

export default App
