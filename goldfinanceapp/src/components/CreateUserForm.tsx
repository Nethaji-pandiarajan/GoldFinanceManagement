import { useState } from "react";
import {
  UserIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";

interface CreateUserFormProps {
  onClose: () => void;
  onSuccess: (formData: any) => void;
}

export default function CreateUserForm({
  onClose,
  onSuccess,
}: CreateUserFormProps) {
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.first_name ||
      !formData.user_name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      setError("Please fill in all required fields marked with *.");
      return;
    }
    onSuccess(formData);
  };

  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 pl-8 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const iconStyle =
    "absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none";
  const passwordInputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 pl-8 pr-10 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">
          Create New User
        </h2>
        {error && (
          <p className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                First Name*
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Username*
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Email*
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Password*
              </label>
              <div className="relative">
                <LockClosedIcon className={iconStyle} />
                <input
                  className={passwordInputStyle} // Use the new style with right padding
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="••••••••••"
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Role*
              </label>
              <div className="relative">
                <IdentificationIcon className={iconStyle} />
                <select
                  name="role"
                  value={formData.role}
                  className={inputStyle}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <hr className="border-gray-700 my-2" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
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
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Gender
              </label>
              <div className="relative">
                <UsersIcon className={iconStyle} />
                <select
                  name="gender"
                  className={inputStyle}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
