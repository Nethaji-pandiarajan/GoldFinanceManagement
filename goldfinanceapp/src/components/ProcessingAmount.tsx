// src/components/ProcessingAmount.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertNotification from './AlertNotification';
import AmountModal from './AmountModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = { show: boolean; type: 'success' | 'error' | 'alert'; message: string; } | null;

type ModalState = {
  isOpen: boolean;
  user: any | null;
  action: 'add' | 'remove';
};

export default function ProcessingAmount() {
  const [users, setUsers] = useState<any[]>([]);
  const [alert, setAlert] = useState<AlertState>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, user: null, action: 'add' });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/processed-amounts`);
      setUsers(response.data);
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Failed to fetch user data.' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user: any, action: 'add' | 'remove') => {
    setModalState({ isOpen: true, user, action });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, user: null, action: 'add' });
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchData();
    const message = modalState.action === 'add' ? 'Amount added successfully!' : 'Amount removed successfully!';
    setAlert({ show: true, type: 'success', message });
  };
  
  const cellStyle = "p-3";
  
  return (
    <>
      {alert?.show && <AlertNotification type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      {modalState.isOpen && (
        <AmountModal
          user={modalState.user}
          action={modalState.action}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          setAlert={setAlert}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-4">Processing Amounts</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="border-b-2 border-[#c69909]">
              <tr>
                <th className={`${cellStyle} w-[30%] text-white`}>User Name</th>
                <th className={`${cellStyle} w-[30%] text-white`}>Email</th>
                <th className={`${cellStyle} w-[25%] text-white`}>Total Invested</th>
                <th className={`${cellStyle} w-[15%] text-white text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="border-b border-gray-800">
                  <td className={`${cellStyle} text-gray-300 truncate`}>{user.user_name}</td>
                  <td className={`${cellStyle} text-gray-300 truncate`}>{user.email}</td>
                  <td className={`${cellStyle} text-gray-300 font-bold`}>
                    ₹{parseFloat(user.total_invested).toLocaleString('en-IN')}
                  </td>
                  <td className={`${cellStyle} text-center`}>
                    <div className="flex justify-center space-x-2">
                        <button onClick={() => handleOpenModal(user, 'add')} className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700">Add</button>
                        <button onClick={() => handleOpenModal(user, 'remove')} className="bg-red-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-red-700">Remove</button>
                    </div>
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