// src/pages/SignupPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import {
  UserIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    password: "",
    date_of_birth: "",
    mobile_number: "",
    gender: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const inputStyle =
    "w-full bg-transparent text-white placeholder-white/60 border-0 border-b-2 border-white/40 focus:outline-none focus:ring-0 focus:border-white rounded-none py-2 px-8 transition-colors duration-300";
  const iconStyle =
    "absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 pointer-events-none";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/signup`,
        formData
      );
      setSuccess(response.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-white/20 backdrop-blur-lg shadow-xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Create New User
        </h2>

        {error && (
          <p className="bg-red-500/50 text-white text-sm p-3 rounded-md mb-4">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-500/50 text-white text-sm p-3 rounded-md mb-4">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Corrected structure for each field */}
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                First Name
              </label>
              <div className="relative">
                <UserIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="first_name"
                  type="text"
                  placeholder="John"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                Last Name
              </label>
              <div className="relative">
                <UserIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="last_name"
                  type="text"
                  placeholder="Doe"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                Username
              </label>
              <div className="relative">
                <AtSymbolIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="user_name"
                  type="text"
                  placeholder="john_doe"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="email"
                  type="email"
                  placeholder="john.doe@email.com"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <CalendarDaysIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="date_of_birth"
                  type="date"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-white/90 text-sm font-bold mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <DevicePhoneMobileIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="mobile_number"
                  type="tel"
                  placeholder="123-456-7890"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-white/90 text-sm font-bold mb-2">
                Gender
              </label>
              <div className="relative">
                <UsersIcon className={iconStyle} />
                <select
                  name="gender"
                  className={inputStyle}
                  onChange={handleChange}
                >
                  <option className="text-black" value="">
                    Select Gender
                  </option>
                  <option className="text-black" value="Male">
                    Male
                  </option>
                  <option className="text-black" value="Female">
                    Female
                  </option>
                  <option className="text-black" value="Other">
                    Other
                  </option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-white/90 text-sm font-bold mb-2">
                Role
              </label>
              <div className="relative">
                <UsersIcon className={iconStyle} />
                <select
                  name="role"
                  value={formData.role}
                  className={inputStyle}
                  onChange={handleChange}
                  required
                >
                  <option className="text-black" value="">
                    Select Role
                  </option>
                  <option className="text-black" value="admin">
                    Admin
                  </option>
                  <option className="text-black" value="super_admin">
                    Super Admin
                  </option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-white/90 text-sm font-bold mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className={iconStyle} />
                <input
                  className={inputStyle}
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              className="w-full text-white font-bold py-3 px-4 transition-all duration-300 rounded-full bg-white/10 backdrop-blur-sm border border-white/50 hover:bg-white/20 hover:border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              type="submit"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-blue-300 hover:text-white hover:underline transition-colors duration-300"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignupPage;
