import { useState } from "react";
import { UserIcon, EnvelopeIcon, IdentificationIcon, CalendarDaysIcon, DevicePhoneMobileIcon, UsersIcon } from "@heroicons/react/24/solid";

interface UserData {
    user_id: number;
    user_name: string;
    first_name: string;
    last_name: string | null;
    email: string;
    role: string;
    date_of_birth: string | null;
    gender: string | null;
    mobile_number: string | null;
}

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    date_of_birth: string;
    gender: string;
    mobile_number: string;
}

interface EditUserModalProps {
    user: UserData;
    onClose: () => void;
    onSuccess: (formData: FormData) => void;
}

export default function EditUserModal({ user, onClose, onSuccess}: EditUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    role: user.role || "admin",
    date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : "",
    gender: user.gender || "",
    mobile_number: user.mobile_number || "",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909] pl-10";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[#c69909] mb-2">
          Edit User: <span className="text-white font-semibold">{user.user_name}</span>
        </h2>
        <p className="text-gray-400 mb-6">User ID: {user.user_id}</p>

        <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelStyle}>First Name*</label>
                    <div className="relative">
                        <UserIcon className={iconStyle} />
                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputStyle} required />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Last Name</label>
                    <div className="relative">
                        <UserIcon className={iconStyle} />
                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Email*</label>
                    <div className="relative">
                        <EnvelopeIcon className={iconStyle} />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} required />
                    </div>
                </div>
                 <div>
                    <label className={labelStyle}>Mobile Number</label>
                    <div className="relative">
                        <DevicePhoneMobileIcon className={iconStyle} />
                        <input type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Date of Birth</label>
                    <div className="relative">
                        <CalendarDaysIcon className={iconStyle} />
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Gender</label>
                    <div className="relative">
                        <UsersIcon className={iconStyle} />
                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputStyle}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className={labelStyle}>Role*</label>
                    <div className="relative">
                        <IdentificationIcon className={iconStyle} />
                        <select name="role" value={formData.role} onChange={handleChange} className={inputStyle} required>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                </div>
            </div>
          
            <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold">
                    Cancel
                </button>
                <button type="button" onClick={() => onSuccess(formData)} className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold">
                    Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}