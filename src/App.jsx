import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireOnboarding, RequireNoBusiness, GuestOnly, PermGate } from "./auth/guards";

// Home / Landing
import Landing from "./pages/home/Landing";

// Auth Pages
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Onboarding from "./pages/auth/Onboarding";

// POS Pages & Layout
import PosLayout from "./components/pos/PosLayout";
import Dashboard from "./pages/pos/Dashboard";
import Inventory from "./pages/pos/Inventory";
import Products from "./pages/pos/Products";
import Categories from "./pages/pos/Categories";
import Checkout from "./pages/pos/Checkout";
import Orders from "./pages/pos/Orders";
import Customers from "./pages/pos/Customers";
import Finance from "./pages/pos/Finance";
import Analytics from "./pages/pos/Analytics";
import Users from "./pages/pos/Users";
import Settings from "./pages/pos/Settings";
import Help from "./pages/pos/Help";
import StockHistory from "./pages/pos/StockHistory";
import FloorPlan from "./pages/pos/FloorPlan";
import PendingApproval from "./pages/auth/PendingApproval";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />

          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/onboarding" element={<RequireNoBusiness><Onboarding /></RequireNoBusiness>} />

          {/* POS Routes wrapped in Layout */}
          <Route path="/dashboard" element={<RequireOnboarding><PosLayout /></RequireOnboarding>}>
            <Route index element={<PermGate perm="dashboard"><Dashboard /></PermGate>} />
            <Route path="checkout" element={<PermGate perm="checkout"><Checkout /></PermGate>} />
            <Route path="floor-plan" element={<PermGate perm={["floor_plan", "tables_edit", "checkout"]}><FloorPlan /></PermGate>} />
            <Route path="orders" element={<PermGate perm="orders"><Orders /></PermGate>} />
            <Route path="customers" element={<PermGate perm="customers"><Customers /></PermGate>} />
            <Route path="finance" element={<PermGate perm="finance"><Finance /></PermGate>} />
            <Route path="analytics" element={<PermGate perm="analytics"><Analytics /></PermGate>} />
            <Route path="users" element={<PermGate perm="users"><Users /></PermGate>} />
            <Route path="settings" element={<PermGate perm="settings"><Settings /></PermGate>} />
            <Route path="help" element={<Help />} />

            {/* Inventory Hub with nested routes */}
            <Route path="inventory" element={<PermGate perm="inventory"><Inventory /></PermGate>}>
              <Route index element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="stock-history" element={<StockHistory />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}