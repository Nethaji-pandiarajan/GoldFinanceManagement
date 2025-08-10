// src/components/LoanPaymentModal.tsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = { show: boolean; type: 'success' | 'error' | 'alert'; message: string; } | null;

const paymentOptions = ['UPI', 'Debit/Credit Card', 'Cash', 'Other'];

type LoanPaymentModalProps = {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

export default function LoanPaymentModal({ loan, onClose, onSuccess, setAlert }: LoanPaymentModalProps) {
  const [formData, setFormData] = useState({
    principal_payment: '',
    interest_payment: '',
    payment_mode: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const principalAmount = parseFloat(formData.principal_payment) || 0;
    const interestAmount = parseFloat(formData.interest_payment) || 0;

    if (principalAmount <= 0 && interestAmount <= 0) {
      setAlert({ show: true, type: 'error', message: 'Please enter a positive payment amount.' });
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        ...formData,
        payment_mode: formData.payment_mode === 'Other' ? formData.remarks : formData.payment_mode,
      };
      await axios.post(`${API_BASE_URL}/api/loans/${loan.loan_id}/payment`, payload);
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to record payment.';
      // We call setAlert but also onClose to see the alert on the main page
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
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-2">Manage Payments</h2>
        <p className="text-gray-400 mb-6">For Loan #{loan.loan_id} ({loan.customer_name})</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Principal Amount Paid (₹)</label>
            <input type="number" name="principal_payment" value={formData.principal_payment} onChange={handleChange} className={inputStyle} placeholder="0.00" step="0.01" />
          </div>
          <div>
            <label className={labelStyle}>Interest Amount Paid (₹)</label>
            <input type="number" name="interest_payment" value={formData.interest_payment} onChange={handleChange} className={inputStyle} placeholder="0.00" step="0.01" />
          </div>
          <div>
            <label className={labelStyle}>Payment Mode</label>
            <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className={inputStyle} required>
              <option value="">Select a Mode</option>
              {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          {formData.payment_mode === 'Other' && (
            <div>
              <label className={labelStyle}>Specify Other Payment Mode*</label>
              <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className={inputStyle} placeholder="e.g., Bank Transfer, Cheque" required />
            </div>
          )}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={loading}>
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}