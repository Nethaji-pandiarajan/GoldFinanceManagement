import { useState } from "react";
import clsx from "clsx";

interface InvestmentModalProps {
    action: 'add' | 'remove';
    onClose: () => void;
    onSuccess: (formData: { amount: string; remarks: string; action: 'add' | 'remove' }) => void;
    currentBalance: number;
}

export default function InvestmentModal({ action, onClose, onSuccess, currentBalance }: InvestmentModalProps) {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const isAddAction = action === "add";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid, positive amount.");
        return;
    }
    onSuccess({ amount, remarks, action });
  };
  
  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-md">
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
            {isAddAction ? "Add to Investment Pool" : "Remove from Investment Pool"}
        </h2>
        <p className="text-gray-400 mb-6">Current Balance: {formatCurrency(currentBalance)}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Amount (₹)*</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputStyle}
              placeholder="0.00"
              step="0.01"
              required
              autoFocus
            />
          </div>
          <div>
            <label className={labelStyle}>Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className={`${inputStyle} h-24`}
              placeholder="e.g., Initial investment, profit withdrawal..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={clsx(
                "px-6 py-2 rounded font-semibold",
                isAddAction 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {isAddAction ? "Add Amount" : "Remove Amount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}