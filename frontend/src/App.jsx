import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Order from './pages/order'
import Start from './pages/start'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Start />} path="/" />
        <Route element={<Start />} path="/cars/:carId" />
        <Route element={<Order />} path="/cars/:carId/order" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
