import React, { useState, useEffect } from 'react';
import api from '../api';

type AlertState = { show: boolean; type: 'success' | 'error' | 'alert'; message: string; } | null;
const paymentOptions = ['UPI', 'Debit/Credit Card', 'Cash', 'Other'];

interface PendingPayment {
  principal_amount_due: string;
  principal_amount_paid: string;
  interest_amount_due: string;
  interest_amount_paid: string;
  payment_month: string;
}

type LoanPaymentModalProps = {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}:</span>
        <span className="font-semibold text-white">{value}</span>
    </div>
);

export default function LoanPaymentModal({ loan, onClose, onSuccess, setAlert }: LoanPaymentModalProps) {
  const [formData, setFormData] = useState({ principal_payment: '', interest_payment: '', payment_mode: '', remarks: '' });
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextPayment = async () => {
      try {
        const response = await api.get(`/api/loans/${loan.loan_id}/next-payment`);
        setPendingPayment(response.data);
      } catch (error) {
        setAlert({ show: true, type: 'error', message: 'Could not fetch pending payment details. The loan might be fully paid.' });
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (loan.loan_id) {
        fetchNextPayment();
    }
  }, [loan.loan_id, setAlert, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPayment) return;
    
    const principalToPay = parseFloat(formData.principal_payment) || 0;
    const interestToPay = parseFloat(formData.interest_payment) || 0;

    if (principalToPay <= 0 && interestToPay <= 0) {
      setAlert({ show: true, type: 'error', message: 'Please enter a positive payment amount.' });
      return;
    }

    const principalDue = parseFloat(pendingPayment.principal_amount_due) - parseFloat(pendingPayment.principal_amount_paid);
    const interestDue = parseFloat(pendingPayment.interest_amount_due) - parseFloat(pendingPayment.interest_amount_paid);

    if (principalToPay > principalDue) {
      setAlert({ show: true, type: 'error', message: `Principal payment cannot exceed the due amount of ₹${principalDue.toFixed(2)}.` });
      return;
    }
    if (interestToPay > interestDue) {
      setAlert({ show: true, type: 'error', message: `Interest payment cannot exceed the due amount of ₹${interestDue.toFixed(2)}.` });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, payment_mode: formData.payment_mode === 'Other' ? formData.remarks : formData.payment_mode };
      await api.post(`/api/loans/${loan.loan_id}/payment`, payload);
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to record payment.';
      setAlert({ show: true, type: 'error', message: errorMessage });
      onClose(); 
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";
  const formatCurrency = (val: string) => `₹${parseFloat(val || '0').toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-2">Manage Payments</h2>
        <p className="text-gray-400 mb-6">For Loan #{loan.loan_id} ({loan.customer_name})</p>

        {loading ? (
            <div className="text-center text-gray-400 p-8">Loading payment details...</div>
        ) : pendingPayment ? (
          <>
            <div className="bg-black/20 p-4 rounded-lg mb-6 space-y-2 border border-gray-700">
                <InfoRow label="Payment for Month" value={new Date(pendingPayment.payment_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
                <InfoRow label="Principal Amount Due" value={formatCurrency(String(parseFloat(pendingPayment.principal_amount_due) - parseFloat(pendingPayment.principal_amount_paid)))} />
                <InfoRow label="Interest Amount Due" value={formatCurrency(String(parseFloat(pendingPayment.interest_amount_due) - parseFloat(pendingPayment.interest_amount_paid)))} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelStyle}>Principal Amount to Pay (₹)</label>
                <input type="number" name="principal_payment" value={formData.principal_payment} onChange={handleChange} className={inputStyle} placeholder="0.00" step="0.01" />
              </div>
              <div>
                <label className={labelStyle}>Interest Amount to Pay (₹)</label>
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
                <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold" disabled={loading}>Cancel</button>
                <button type="submit" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </>
        ) : (
            <div className="text-center text-green-400 p-8">This loan appears to be fully paid.</div>
        )}
      </div>
    </div>
  );
}