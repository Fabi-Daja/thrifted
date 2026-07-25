import { Route, Routes } from "react-router-dom"
import { Navbar } from "./components/layout/Navbar"
import { Footer } from "./components/layout/Footer"
import { ProtectedRoute } from "./components/layout/ProtectedRoute"
import { HomePage } from "./pages/HomePage"
import { SearchPage } from "./pages/SearchPage"
import { ProductDetailPage } from "./pages/ProductDetailPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { VerifyEmailPage } from "./pages/VerifyEmailPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { PlaceholderPage } from "./pages/PlaceholderPage"

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/users/:id"
            element={<PlaceholderPage title="Profili i shitësit" note="Vjen së shpejti." />}
          />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/me"
              element={<PlaceholderPage title="Profili im" note="Vjen së shpejti." />}
            />
            <Route
              path="/create-product"
              element={<PlaceholderPage title="Krijo produkt" note="Vjen së shpejti." />}
            />
            <Route
              path="/products/:id/edit"
              element={<PlaceholderPage title="Edito produkt" note="Vjen së shpejti." />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
