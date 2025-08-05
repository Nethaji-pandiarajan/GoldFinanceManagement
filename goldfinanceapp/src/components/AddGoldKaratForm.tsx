// src/components/AddGoldKaratForm.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = { show: boolean; type: 'success' | 'error' | 'alert'; message: string; } | null;

type AddGoldKaratFormProps = {
  mode: 'add' | 'edit';
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

export default function AddGoldKaratForm({ mode, initialData, onClose, onSuccess, setAlert }: AddGoldKaratFormProps) {
  const [formData, setFormData] = useState({
    karat_name: '',
    loan_percentage: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        karat_name: initialData.karat_name || '',
        loan_percentage: initialData.loan_percentage || '',
        description: initialData.description || '',
      });
    }
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'edit') {
        await axios.put(`${API_BASE_URL}/api/karats/${initialData.karat_id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/karats`, formData);
      }
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${mode} karat detail.`;
      setAlert({ show: true, type: 'error', message: errorMessage });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">{mode === 'edit' ? 'Edit Gold Karat' : 'Add New Gold Karat'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Karat Name*</label>
              <input type="text" name="karat_name" value={formData.karat_name} onChange={handleChange} className={inputStyle} required placeholder="e.g., 22K, 24K, 18K" />
            </div>
            <div>
              <label className={labelStyle}>Loan Percentage (%)*</label>
              <input type="number" name="loan_percentage" value={formData.loan_percentage} onChange={handleChange} className={inputStyle} required placeholder="e.g., 75.50" step="0.01" />
            </div>
            <div>
              <label className={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className={inputStyle} rows={3}></textarea>
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold" disabled={loading}>Cancel</button>
            <button type="submit" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={loading}>
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update Karat' : 'Save Karat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}