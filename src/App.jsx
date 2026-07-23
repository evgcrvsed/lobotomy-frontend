import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RequireAdmin from './components/RequireAdmin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/:collectionSlug/:productSlug" element={<ProductPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
