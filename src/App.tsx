import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TestConn from './pages/TestConn'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test-connection" element={<TestConn />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
