// src/components/AmountModal.tsx
import React, { useState } from "react";
import axios from "axios";
import clsx from "clsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

type AmountModalProps = {
  user: any;
  action: "add" | "remove";
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

export default function AmountModal({
  user,
  action,
  onClose,
  onSuccess,
  setAlert,
}: AmountModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const isAddAction = action === "add";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setAlert({
        show: true,
        type: "error",
        message: "Please enter a valid, positive amount.",
      });
      return;
    }
    if (!isAddAction && numericAmount > parseFloat(user.total_invested)) {
      setAlert({
        show: true,
        type: "error",
        message: "Cannot remove more than the total invested amount.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: user.user_id,
        amount: isAddAction ? numericAmount : -numericAmount,
      };
      await axios.post(`${API_BASE_URL}/api/users/processed-amounts`, payload);
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${action} amount.`;
      setAlert({ show: true, type: "error", message: errorMessage });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-2">
          {isAddAction ? "Add Amount" : "Remove Amount"}
        </h2>
        <p className="text-gray-400 mb-6">For User: {user.user_name}</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputStyle}
                placeholder="0.00"
                step="0.01"
                autoFocus
                required
              />
              {!isAddAction && (
                <p className="text-xs text-gray-500 mt-1">
                  Total Invested: ₹
                  {parseFloat(user.total_invested).toLocaleString()}
                </p>
              )}
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
              className={clsx(
                "px-6 py-2 rounded text-white font-semibold",
                isAddAction
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isAddAction
                ? "Confirm Add"
                : "Confirm Remove"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
