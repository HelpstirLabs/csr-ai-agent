import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import FunderDashboard from "./pages/FunderDashboard";
import NGODashboard from "./pages/NGODashboard";

export default function App() {
  const { isAuthenticated, role, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  if (role === "ngo") {
    return <NGODashboard onLogout={logout} />;
  }

  return <FunderDashboard onLogout={logout} />;
}
