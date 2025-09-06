// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
// import logo from "../assets/logo.png";
import mainlogo from "../assets/MgfLogoblack.png"
import { UserCircleIcon, LockClosedIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = "https://goldfinancemanagementtesting.onrender.com"

function LoginPage({
  onLoginSuccess,
}: {
  onLoginSuccess: (token: string) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const inputStyle =
    "w-full bg-transparent text-white placeholder-white/60 border-0 border-b-2 border-white/40 focus:outline-none focus:ring-0 focus:border-white rounded-none py-2 px-8 transition-colors duration-300";
  const iconStyle =
    "absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 text-[#c69909] pointer-events-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (identifier.toLowerCase() === "mayagoldfinance" && password === "mayagoldfinance") {
      navigate("/signup");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        identifier,
        password,
      });
      onLoginSuccess(response.data.token);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-[#111315] backdrop-blur-lg shadow-xl rounded-2xl p-8">
        <div className="flex justify-center mb-4">
          <img src={mainlogo} alt="Maya Gold Finance Logo" className="h-20" />
        </div>
        <h2 className="text-3xl font-bold text-[#c69909] text-center mb-8">
          Maya Gold Finance
        </h2>
        {error && (
          <p className="bg-red-500/50 text-white text-sm p-3 rounded-md mb-4">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-6">
            <label
              className="block text-[#c69909] text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email or Username
            </label>
            <div className="relative">
              <UserCircleIcon className={iconStyle} />
              <input
                className={inputStyle}
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-2">
            <label
              className="block text-[#c69909] text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className={iconStyle} />
              <input
                className={inputStyle}
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-right mb-6">
            <a
              className="inline-block align-baseline font-bold text-sm text-[#c69909] hover:text-white"
              href="#"
            >
              Forgot password?
            </a>
          </div>
          <div className="mb-4">
            <button
              className="w-full text-white font-bold py-3 px-4 transition-all duration-300 rounded-full bg-white/10 backdrop-blur-sm border border-white/50  hover:bg-[#c69909] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              type="submit"
            >
              SIGN IN
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
