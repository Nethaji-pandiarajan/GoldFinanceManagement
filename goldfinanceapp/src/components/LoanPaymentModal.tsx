import React, { useState, useEffect } from "react";
import api from "../api";

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

interface PaymentInstallment {
  payment_id: number;
  payment_month: string;
  loan_balance: string;
  interest_amount_due: string;
  payment_status: string;
}

type LoanPaymentModalProps = {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-400">{label}:</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
);

export default function LoanPaymentModal({
  loan,
  onClose,
  onSuccess,
  setAlert,
}: LoanPaymentModalProps) {
  const [formData, setFormData] = useState({
    principal_payment: "",
    interest_payment: "",
    payment_mode: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [isNewLoanView, setIsNewLoanView] = useState(false);
  const [availableInstallments, setAvailableInstallments] = useState<
    PaymentInstallment[]
  >([]);
  const [selectedInstallment, setSelectedInstallment] =
    useState<PaymentInstallment | null>(null);
  useEffect(() => {
    if (loan && loan.loan_datetime) {
      const loanStartDate = new Date(loan.loan_datetime);
      const today = new Date();
      const timeDiff = today.getTime() - loanStartDate.getTime();
      const daysSinceStart = Math.floor(timeDiff / (1000 * 3600 * 24));

      const isNewView = daysSinceStart <= 30;
      setIsNewLoanView(isNewView);
      let payableInstallments = loan.payments
        .filter((p: PaymentInstallment) => ['Pending', 'Overdue'].includes(p.payment_status));

      if (loan.completion_status !== 'Completed') {
          const allPaymentsSorted = [...loan.payments].sort(
            (a: PaymentInstallment, b: PaymentInstallment) => 
              new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime()
          );
          const lastPayment = allPaymentsSorted[allPaymentsSorted.length - 1];

          if (lastPayment && lastPayment.payment_status === 'Paid') {
             if (!payableInstallments.find((p: any) => p.payment_id === lastPayment.payment_id)) {
                 payableInstallments.push(lastPayment);
             }
          }
      }
      payableInstallments.sort((a: PaymentInstallment, b: PaymentInstallment) => 
        new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime()
      );
      setAvailableInstallments(payableInstallments);
      if (payableInstallments.length > 0) {
        setSelectedInstallment(payableInstallments[0]);
      } else {
        setSelectedInstallment(null);
      }
    }
  }, [loan]);

  const isInterestSettled = selectedInstallment
    ? parseFloat(selectedInstallment.interest_amount_due) <= 0 || selectedInstallment.payment_status === 'Paid'
    : false

  const handleInstallmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const paymentId = parseInt(e.target.value, 10);
    const installment =
      availableInstallments.find((p) => p.payment_id === paymentId) || null;
    setSelectedInstallment(installment);
    setFormData({
      principal_payment: "",
      interest_payment: "",
      payment_mode: "",
      remarks: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) {
      setAlert({
        show: true,
        type: "error",
        message: "Please select an installment to pay.",
      });
      return;
    }

    const principalToPay = parseFloat(formData.principal_payment) || 0;
    const interestToPay = parseFloat(formData.interest_payment) || 0;
    const maxPrincipalPayable = parseFloat(selectedInstallment.loan_balance);

    if (principalToPay > maxPrincipalPayable) {
       setAlert({
        show: true,
        type: "error",
        message: `Principal payment cannot exceed the remaining balance of ₹${maxPrincipalPayable.toLocaleString("en-IN")}`,
      });
      return;
    }
    
    if (principalToPay <= 0 && interestToPay <= 0) {
      setAlert({
        show: true,
        type: "error",
        message: "Please enter a positive payment amount.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
          ...formData,
          payment_id: selectedInstallment.payment_id
      };
      await api.post(`/api/loans/${loan.loan_id}/payment`, payload);
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to record payment.";
      setAlert({ show: true, type: "error", message: errorMessage });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";
  const formatCurrency = (val: string) =>
    `₹${parseFloat(val || "0").toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-2">
          Record Payment
        </h2>
        <p className="text-gray-400 mb-6">
          For Loan #{loan.loan_id} ({loan.customer_name})
        </p>

        {!selectedInstallment ? (
          <div className="text-center text-green-400 p-8">
            This loan appears to be fully paid. No pending installments found.
          </div>
        ) : (
          <>
            {!isNewLoanView && availableInstallments.length > 1 && (
              <div className="mb-6">
                <label className={labelStyle}>Select Installment to Pay</label>
                <select
                  onChange={handleInstallmentSelect}
                  value={selectedInstallment.payment_id}
                  className={inputStyle}
                >
                  {availableInstallments.map((p) => (
                    <option key={p.payment_id} value={p.payment_id}>
                      {new Date(p.payment_month).toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      - ({p.payment_status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-black/20 p-4 rounded-lg mb-6 space-y-2 border border-gray-700">
              <InfoRow
                label="Payment for Month"
                value={new Date(
                  selectedInstallment.payment_month
                ).toLocaleString("default", { month: "long", year: "numeric" })}
              />
              <InfoRow
                label="Principal Due"
                value={formatCurrency(selectedInstallment.loan_balance)}
              />
              <InfoRow
                label="Interest Due"
                value={formatCurrency(selectedInstallment.interest_amount_due)}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelStyle}>
                  Principal Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  name="principal_payment"
                  value={formData.principal_payment}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="0.00"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                  }}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelStyle}>Interest Amount to Pay (₹)
                {isInterestSettled && (
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      ✓ Paid
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  name="interest_payment"
                  value={isInterestSettled ? "" : formData.interest_payment}
                  onChange={handleChange}
                  className={inputStyle}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                  }}
                  placeholder={isInterestSettled ? "Interest already settled" : "0.00"}
                  step="0.01"
                  disabled={isInterestSettled}
                />
              </div>
              <div>
                <label className={labelStyle}>Payment Mode</label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                >
                  <option value="">Select a Mode</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.payment_mode === "Other" && (
                <div>
                  <label className={labelStyle}>
                    Specify Other Payment Mode*
                  </label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="e.g., Cheque"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Save Payment"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
