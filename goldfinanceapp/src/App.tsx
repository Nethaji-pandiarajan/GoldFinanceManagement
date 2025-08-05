// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import MainLayout from './components/layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
type DecodedToken = {
  user: {
    id: number;
    username: string;
    role: string;
  };
  iat: number;
  exp: number;
};
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserRole(decoded.user.role);
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false); 
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUserRole(decoded.user.role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (isLoading) {
    return <div className="h-screen w-screen bg-black" />;
  }

  return (
    <Router>
      <Routes>
        {isLoggedIn ? (
          <>
            <Route path="/mainlayout" element={<MainLayout onLogout={handleLogout} userRole={userRole}/>} />
            <Route path="*" element={<Navigate to="/mainlayout" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;