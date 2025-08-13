import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import MainLayout from "./components/layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AlertNotification from "./components/AlertNotification";
import { setGlobalAlert } from "./api";
interface User {
  id: number;
  username: string;
  role: string;
  firstName: string;
}

type DecodedToken = {
  user: User;
  iat: number;
  exp: number;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            localStorage.removeItem("authToken");
            setUser(null);
        } else {
            setUser(decoded.user);
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);
  useEffect(() => {
    setGlobalAlert(setAlert);
  }, []);
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("authToken", token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUser(decoded.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  if (isLoading) {
    return <div className="h-screen w-screen bg-black" />;
  }

  return (
    <Router>
      <Routes>
        {user ? (
          <>
           {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
            <Route
              path="/mainlayout"
              element={
                <MainLayout onLogout={handleLogout} user={user} />
              }
            />
            <Route path="*" element={<Navigate to="/mainlayout" />} />
          </>
        ) : (
          <>
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
