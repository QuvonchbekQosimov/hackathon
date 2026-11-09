import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import AuthProvider from "./AuthProvider";
import { useAuth } from "./auth-context";
import ErrorBoundary from "./components/ErrorBoundary";
import { Loading, ErrorNotice, PublicShell } from "./components/UI";

const Home = lazy(() => import("./pages/Home"));
const PublicAnalytics = lazy(() => import("./pages/PublicAnalytics"));
const B2BMarket = lazy(() => import("./pages/B2BMarket"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function PrivateRoute({ children }) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error)
    return (
      <PublicShell>
        <ErrorNotice message={error} retry={refresh} />
      </PublicShell>
    );
  return user ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
function NotFound() {
  return (
    <PublicShell>
      <div className="py-20 text-center">
        <p className="text-blue-600 font-bold">404</p>
        <h1 className="text-3xl font-bold my-4">Sahifa topilmadi</h1>
        <Link className="btn-primary" to="/">
          Bosh sahifa
        </Link>
      </div>
    </PublicShell>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analytics" element={<PublicAnalytics />} />
              <Route path="/marketplace" element={<B2BMarket />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
