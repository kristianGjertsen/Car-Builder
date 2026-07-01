import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const Order = lazy(() => import('./pages/order'))
const Start = lazy(() => import('./pages/start'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Start />} path="/" />
          <Route element={<Start />} path="/cars/:carId" />
          <Route element={<Order />} path="/cars/:carId/order" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
