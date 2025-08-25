// src/components/TotalInvestments.tsx

import { useState, useEffect, useMemo } from "react";
import AlertNotification from "./AlertNotification";
import BulkAmountModal from "./BulkAmountModal"; 
import api from '../api';
import { BanknotesIcon, PencilIcon} from "@heroicons/react/24/solid";

interface ModalState {
  isOpen: boolean;
  action: "add" | "remove";
}

interface UserInvestment {
  total_invested: string;
  investment_updated_by: string;
}

export default function TotalInvestments() {
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, action: 'add' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/users/investments`);
      setUserInvestments(response.data);
    } catch (error) {
      console.error("Failed to fetch investment data:", error);
      setAlert({ show: true, type: "error", message: "Failed to fetch investment data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalInvestment = useMemo(() => {
    return userInvestments.reduce((total, user) => total + parseFloat(user.total_invested || '0'), 0);
  }, [userInvestments]);

  const lastUpdater = useMemo(() => {
    if (userInvestments.length === 0) return 'N/A';
    return userInvestments[0]?.investment_updated_by || 'N/A';
  }, [userInvestments]);

  const handleOpenModal = (action: "add" | "remove") => {
    setModalState({ isOpen: true, action: action });
  };

  const handleSuccess = () => {
    setModalState({ isOpen: false, action: 'add' });
    fetchData();
    const message = modalState.action === "add" ? "Amount added successfully!" : "Amount removed successfully!";
    setAlert({ show: true, type: "success", message });
  };
  
  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      {modalState.isOpen && (
        <BulkAmountModal
          action={modalState.action}
          onClose={() => setModalState({ isOpen: false, action: 'add' })}
          onSuccess={handleSuccess}
          setAlert={setAlert}
          totalCurrentInvestment={totalInvestment}
        />
      )}
      <div className="bg-[#111315] p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#c69909]">Total Investment</h1>
        </div>
        
        {loading ? (
          <div className="text-center p-10">
            <p className="text-gray-400">Loading Total Investment...</p>
          </div>
        ) : (
          <div className="bg-[#1f2628] border-2 border-[#c69909]/30 rounded-lg p-8 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <BanknotesIcon className="h-16 w-16 text-[#c69909]" />
            <div>
              <p className="text-xl font-semibold text-gray-300 text-center">Grand Total Invested</p>
              <p className="text-5xl font-bold text-white text-center mt-2">{formatCurrency(totalInvestment)}</p>
              <p className="text-sm text-gray-500 text-center mt-3">
                Last Updated By: <span className="font-semibold text-gray-400">{lastUpdater}</span>
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-center space-x-6 mt-10">
          <button 
            onClick={() => handleOpenModal("add")} 
            className="flex items-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
            disabled={loading}
          >
            <PencilIcon className="h-6 w-6 mr-2" /> 
            Update
          </button>
          {/* <button 
            onClick={() => handleOpenModal("remove")} 
            className="flex items-center bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
            disabled={loading}
          >
            <MinusIcon className="h-6 w-6 mr-2" /> 
            Remove
          </button> */}
        </div>
      </div>
    </>
  );
}