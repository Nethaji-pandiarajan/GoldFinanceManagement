import { useState, useRef } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { PlusIcon, BanknotesIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import InvestmentModal from "./InvestmentModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
DataTable.use(DT);

export default function TotalInvestments() {
  const [alert, setAlert] = useState<any>(null);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'add' | 'remove'>('add');
  const tableRef = useRef<any>();

  const handleOpenModal = (action: 'add' | 'remove') => {
    setModalAction(action);
    setModalOpen(true);
  };

  const handleTransactionSubmit = async (formData: { amount: string; remarks: string; action: 'add' | 'remove' }) => {
    setModalOpen(false); 
    try {
        await api.post('/api/investments', formData);
        setAlert({ show: true, type: 'success', message: 'Transaction recorded successfully!' });
        tableRef.current?.dt().ajax.reload();
    } catch (error: any) {
        setAlert({ show: true, type: 'error', message: error.response?.data?.message || 'Transaction failed.' });
    }
  };

  const ajaxConfig = {
    url: `${API_BASE_URL}/api/investments`,
    dataSrc: (json: any) => {
        setGrandTotal(parseFloat(json.grandTotal || '0'));
        return json.transactions;
    },
    headers: { 'x-auth-token': localStorage.getItem('authToken') || '' }
  };

  const tableColumns = [
    { title: "Added Date", data: "added_on", render: (data: string) => new Date(data).toLocaleString() },
    { 
      title: "Transaction Amount", 
      data: "amount_added", 
      render: (data: string) => {
        const amount = parseFloat(data);
        const isCredit = amount >= 0;
        return `<span class="${isCredit ? 'text-green-400' : 'text-red-400'} font-semibold">${isCredit ? '+' : '-'} ₹${Math.abs(amount).toLocaleString('en-IN')}</span>`;
      }
    },
    { 
      title: "Current Balance", 
      data: "current_balance", 
      render: (data: string) => `₹${parseFloat(data).toLocaleString('en-IN')}`
    },
    { title: "Added By", data: "added_by" },
    { title: "Remarks", data: "remarks" }
  ];

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      {isModalOpen && (
        <InvestmentModal
            action={modalAction}
            onClose={() => setModalOpen(false)}
            onSuccess={handleTransactionSubmit}
            currentBalance={grandTotal}
        />
      )}
      <div className="space-y-8">
        <div className="bg-[#111315] p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#c69909]">Total Investment</h1>
          </div>
          
          <div className="bg-[#1f2628] border-2 border-[#c69909]/30 rounded-lg p-8 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <BanknotesIcon className="h-16 w-16 text-[#c69909]" />
            <div>
              <p className="text-xl font-semibold text-gray-300 text-center">Grand Total Invested</p>
              <p className="text-5xl font-bold text-white text-center mt-2">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6 mt-10">
            <button 
              onClick={() => handleOpenModal("add")} 
              className="flex items-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
            >
              <PlusIcon className="h-6 w-6 mr-2" /> 
              Add Investment
            </button>
            {/* <button 
              onClick={() => handleOpenModal("remove")} 
              className="flex items-center bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
            >
              <MinusIcon className="h-6 w-6 mr-2" /> 
              Remove Investment
            </button> */}
          </div>
        </div>
        <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-[#c69909] mb-4">Transaction History</h2>
            <DataTable
              ref={tableRef}
              id="investmentHistoryTable"
              className="display w-full"
              ajax={ajaxConfig}
              columns={tableColumns}
            />
        </div>
      </div>
    </>
  );
}