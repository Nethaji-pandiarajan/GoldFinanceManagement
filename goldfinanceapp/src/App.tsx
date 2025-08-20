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
import { invoke } from "@tauri-apps/api";
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
type LicenseStatus = 'checking' | 'licensed' | 'unlicensed';
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>('checking');
  useEffect(() => {
    const checkAndLoad = async () => {
      const startTime = Date.now();
      let isLicensed = false;
      try {
        isLicensed = await invoke('check_license') as boolean;
        
      } catch (e) {
        console.error("License check failed to communicate with Rust:", e);
        isLicensed = false;
      }
      
      const status: LicenseStatus = isLicensed ? 'licensed' : 'unlicensed';
      const elapsedTime = Date.now() - startTime;
      const delayNeeded = 5000 - elapsedTime;
      if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }
      
      setLicenseStatus(status);
      if (status === 'licensed') {
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
      }
      setIsLoading(false);
    }
    
    checkAndLoad();
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
  if (licenseStatus === 'checking' || isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111315] text-[#c69909]">
        <svg className="animate-spin h-10 w-10 text-[#c69909]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl">Initializing License Check...</p>
      </div>
    );
  }
  if (licenseStatus === 'unlicensed') {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-900/50 text-red-300">
            <h1 className="text-4xl font-bold">LICENSE ERROR</h1>
            <p className="mt-4 text-xl text-center">This device is not registered as a licensed machine.</p>
            <p className="text-sm mt-2">Please contact support for licensing activation.</p>
        </div>
    );
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
