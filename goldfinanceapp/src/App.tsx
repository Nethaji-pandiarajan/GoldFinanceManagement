import { useState, useEffect ,useRef, useCallback} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import api from "./api";
import { jwtDecode } from "jwt-decode";
import MainLayout from "./components/layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AlertNotification from "./components/AlertNotification";
import { setGlobalAlert } from "./api";
import { invoke } from "@tauri-apps/api";
interface MachineInfo {
  cpu_brand: string;
  mac_address: string;
}
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
  const inactivityTimerRef = useRef<number | null>(null);
  const INACTIVITY_TIMEOUT_MS =  15 * 60 * 1000;
  const logoutDueToInactivity = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    handleLogout();
    setAlert({
        show: true,
        type: 'alert',
        message: 'You have been logged out due to inactivity.'
    });
  }, []); 
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT_MS);
  }, [logoutDueToInactivity]);
  useEffect(() => {
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];
    if (user) {
      resetInactivityTimer();
      activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer);
      });
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user, resetInactivityTimer]);
  useEffect(() => {
    const verifyDeviceAndLoad  = async () => {
      const startTime = Date.now();
      let isLicensed = false;
      try {
        const machineInfo = await invoke<MachineInfo>('get_machine_details');
        console.log("Got machine details from Rust:", machineInfo);
        const response = await api.post('/api/auth/verify-license', {
            cpu_brand: machineInfo.cpu_brand,
            mac_address: machineInfo.mac_address,
        });
        isLicensed = response.data.isLicensed;
      } catch (e) {
        console.error("License check failed:", e);
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
    
    verifyDeviceAndLoad();
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
            <p className="text-sm mt-2">Check your internet connection and try again.</p>
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
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />}/>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
