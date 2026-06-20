import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Start from './pages/start'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Start />} path="/" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
