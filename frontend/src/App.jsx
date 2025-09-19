import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ConnectionsPage from "./pages/ConnectionsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PoliciesPage from "./pages/PoliciesPage";
import ReportsPage from "./pages/ReportsPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="services/:providerId" element={<ServiceDetailsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
