//addschemeform
import React, { useState } from "react";
import api from "../api";
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

interface AddSchemeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
}
export default function AddSchemeForm({ onClose, onSuccess, setAlert } : AddSchemeFormProps) {
  const [formData, setFormData] = useState({ scheme_name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/schemes', formData);
      onSuccess();
    } catch (err: any) {
      setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to create scheme.' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">Add New Scheme</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Scheme Name*</label>
            <input type="text" name="scheme_name" value={formData.scheme_name} onChange={handleChange} className={inputStyle} required autoFocus />
          </div>
          <div>
            <label className={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className={inputStyle} rows={4}></textarea>
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500" disabled={loading}>Cancel</button>
            <button type="submit" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={loading}>
              {loading ? 'Saving...' : 'Save Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}