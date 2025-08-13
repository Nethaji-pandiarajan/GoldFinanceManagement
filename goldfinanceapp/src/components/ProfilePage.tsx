import { useState, useEffect } from "react";
import api from "../api";
import AlertNotification from "./AlertNotification";

interface ProfileData {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  date_of_birth: string;
  mobile_number: string;
  gender: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/users/me`);
        const data = response.data;
        if (data.date_of_birth) {
            data.date_of_birth = data.date_of_birth.split('T')[0];
        }
        setProfile(data);
      } catch (error) {
        setAlert({ show: true, type: 'error', message: 'Failed to fetch profile data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await api.put(`/api/users/me`);
      setAlert({ show: true, type: 'success', message: 'Profile updated successfully!' });
    } catch (err: any) {
      setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";
  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const disabledInputStyle = "bg-black/20 cursor-not-allowed text-gray-400";

  if (loading) {
    return <div className="text-center p-8 text-white">Loading Profile...</div>;
  }

  if (!profile) {
    return <div className="text-center p-8 text-red-400">Could not load profile.</div>;
  }

  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#c69909] mb-6">My Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelStyle}>Username</label><input type="text" value={profile.user_name} className={`${inputStyle} ${disabledInputStyle}`} readOnly /></div>
            <div><label className={labelStyle}>Role</label><input type="text" value={profile.role} className={`${inputStyle} ${disabledInputStyle}`} readOnly /></div>
            <div><label className={labelStyle}>First Name*</label><input type="text" name="first_name" value={profile.first_name} onChange={handleChange} className={inputStyle} required /></div>
            <div><label className={labelStyle}>Last Name</label><input type="text" name="last_name" value={profile.last_name || ''} onChange={handleChange} className={inputStyle} /></div>
            <div><label className={labelStyle}>Email*</label><input type="email" name="email" value={profile.email} onChange={handleChange} className={inputStyle} required /></div>
            <div><label className={labelStyle}>Mobile Number</label><input type="tel" name="mobile_number" value={profile.mobile_number || ''} onChange={handleChange} className={inputStyle} /></div>
            <div><label className={labelStyle}>Date of Birth</label><input type="date" name="date_of_birth" value={profile.date_of_birth || ''} onChange={handleChange} className={inputStyle} /></div>
            <div><label className={labelStyle}>Gender</label><select name="gender" value={profile.gender || ''} onChange={handleChange} className={inputStyle}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
          </div>
          <div className="flex justify-end mt-8">
            <button type="submit" className="px-8 py-3 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}