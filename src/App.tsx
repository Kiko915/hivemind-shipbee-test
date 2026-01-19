import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ChatWidget from '@/components/chat/ChatWidget'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  )
}

export default App
