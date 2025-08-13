import { useState, useEffect } from "react";
import api from "../api";
import AlertNotification from "./AlertNotification";
import { BanknotesIcon } from "@heroicons/react/24/solid";


interface Transaction {
  process_id: number;
  user_id: number;
  user_name: string;
  processed_amount: string;
  processed_at: string;
}

export default function ProcessingAmount() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>('0');
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/processing`);
        setTransactions(response.data.transactions);
        setGrandTotal(response.data.grandTotal);
      } catch (error) {
        setAlert({ show: true, type: "error", message: "Failed to fetch processing data." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const cellStyle = "p-3";
  const headerCellStyle = `${cellStyle} text-white font-semibold`;
  const formatCurrency = (value: string | number) => `₹${parseFloat(String(value)).toLocaleString("en-IN")}`;

  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-4">Processing Amounts Log</h1>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-[#c69909]">
              <tr>
                <th className={headerCellStyle}>Process ID</th>
                <th className={headerCellStyle}>User ID</th>
                <th className={headerCellStyle}>Processed By</th>
                <th className={headerCellStyle}>Amount</th>
                <th className={headerCellStyle}>Processed At</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#c69909]/10 border-b-2 border-[#c69909]/50">
                <td colSpan={3} className={`${cellStyle} text-right font-bold text-[#c69909]`}>
                  <div className="flex items-center justify-end">
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    <span>Grand Total Processed</span>
                  </div>
                </td>
                <td colSpan={2} className={`${cellStyle} text-left font-bold text-xl text-white`}>
                  {loading ? 'Calculating...' : formatCurrency(grandTotal)}
                </td>
              </tr>
              
              {loading && transactions.length === 0 && (
                <tr><td colSpan={5} className="text-center p-8 text-gray-400">Loading Transactions...</td></tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={5} className="text-center p-8 text-gray-400">No processing transactions found.</td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.process_id} className="border-b border-gray-800 hover:bg-white/5">
                  <td className={`${cellStyle} text-gray-400`}>{tx.process_id}</td>
                  <td className={`${cellStyle} text-gray-300`}>{tx.user_id}</td>
                  <td className={`${cellStyle} text-gray-300`}>{tx.user_name}</td>
                  <td className={`${cellStyle} text-white font-semibold ${parseFloat(tx.processed_amount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(tx.processed_amount)}
                  </td>
                  <td className={`${cellStyle} text-gray-400`}>
                    {new Date(tx.processed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}