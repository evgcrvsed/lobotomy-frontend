import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import CheckoutFailPage from './pages/CheckoutFailPage'
import TrackPage from './pages/TrackPage'
import OrderPage from './pages/OrderPage'
import LoginPage from './pages/LoginPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminOrderEditPage from './pages/AdminOrderEditPage'
import AdminStatsPage from './pages/AdminStatsPage'
import AdminTrafficPage from './pages/AdminTrafficPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ContractOfferPage from './pages/ContractOfferPage'
import RequireAdmin from './components/RequireAdmin'
import DeliveryInfoPage from "./pages/DeliveryInfoPage.jsx";
import ReturnPolicyPage from "./pages/ReturnPolicyPage.jsx";
import ContactsPage from "./pages/ContactsPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          {/* Т-Банк возвращает покупателя сюда; номер заказа приходит в пути.
              Варианты без номера оставлены на случай старых ссылок. */}
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/success/:number" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/fail" element={<CheckoutFailPage />} />
          <Route path="/checkout/fail/:number" element={<CheckoutFailPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/order/:number" element={<OrderPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contract-offer" element={<ContractOfferPage />} />
          <Route path="/delivery-info" element={<DeliveryInfoPage />} />
          <Route path="/:collectionSlug/:productSlug" element={<ProductPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RequireAdmin>
                <AdminOrdersPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/orders/:number"
            element={
              <RequireAdmin>
                <AdminOrderEditPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <RequireAdmin>
                <AdminStatsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/traffic"
            element={
              <RequireAdmin>
                <AdminTrafficPage />
              </RequireAdmin>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
