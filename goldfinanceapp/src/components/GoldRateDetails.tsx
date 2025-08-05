// src/components/GoldRateDetails.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AlertNotification from './AlertNotification';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = { show: boolean; type: 'success' | 'error' | 'alert'; message: string; } | null;

export default function GoldRateDetails() {
  const [rates, setRates] = useState<any[]>([]);
  const [karats, setKarats] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [newRateData, setNewRateData] = useState({ karat_id: '', today_rate: '' });
  const [alert, setAlert] = useState<AlertState>(null);

  const fetchRates = async () => {
    try {
      const ratesRes = await axios.get(`${API_BASE_URL}/api/gold-rates`);
      const karatsRes = await axios.get(`${API_BASE_URL}/api/karats-list`);
      setRates(ratesRes.data);
      setKarats(karatsRes.data);
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Failed to fetch data.' });
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleEditClick = (rate: any) => {
    setEditingRowId(rate.rate_id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, rateId: number) => {
    const updatedRates = rates.map(rate =>
      rate.rate_id === rateId ? { ...rate, today_rate: e.target.value } : rate
    );
    setRates(updatedRates);
  };

  const handleUpdate = async (rateId: number) => {
    const rateToUpdate = rates.find(r => r.rate_id === rateId);
    if (!rateToUpdate) return;

    try {
      await axios.put(`${API_BASE_URL}/api/gold-rates/${rateId}`, { today_rate: rateToUpdate.today_rate });
      setAlert({ show: true, type: 'success', message: 'Rate updated successfully!' });
      setEditingRowId(null);
      fetchRates();
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Failed to update rate.' });
    }
  };

  const handleAddNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setNewRateData({...newRateData, [e.target.name]: e.target.value });
  }

  const handleAddNewSubmit = async () => {
      if (!newRateData.karat_id || !newRateData.today_rate) {
          setAlert({ show: true, type: 'alert', message: 'Please select a karat and enter a rate.'});
          return;
      }
      try {
          await axios.post(`${API_BASE_URL}/api/gold-rates`, newRateData);
          setAlert({ show: true, type: 'success', message: 'New rate added successfully!' });
          setNewRateData({ karat_id: '', today_rate: '' }); 
          fetchRates();
      } catch (error) {
          setAlert({ show: true, type: 'error', message: 'Failed to add new rate.' });
      }
  }

  const cellStyle = "p-3";
  const inputStyle = "w-full p-2 rounded bg-[#1f2628] text-white border border-gray-600 focus:outline-none focus:border-[#c69909]";

  return (
    <>
      {alert?.show && <AlertNotification type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-4">Manage Gold Rates</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-[#c69909]">
              <tr>
                <th className={`${cellStyle} text-white`}>Karat Name</th>
                <th className={`${cellStyle} text-white`}>Today's Rate (per gram)</th>
                <th className={`${cellStyle} text-white text-center`}>Update</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.rate_id} className="border-b border-gray-800">
                  <td className={`${cellStyle} text-white font-semibold`}>{rate.karat_name}</td>
                  <td className={cellStyle}>
                    {editingRowId === rate.rate_id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={rate.today_rate}
                        onChange={(e) => handleInputChange(e, rate.rate_id)}
                        className={inputStyle}
                      />
                    ) : (
                      <span onClick={() => handleEditClick(rate)} className="cursor-pointer p-2 hover:bg-[#1f2628] rounded-md">
                        ₹{parseFloat(rate.today_rate).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className={`${cellStyle} text-center`}>
                    {editingRowId === rate.rate_id && (
                      <button 
                        onClick={() => handleUpdate(rate.rate_id)} 
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#1f2628]/50">
                <tr>
                    <td className={cellStyle}>
                        <select name="karat_id" value={newRateData.karat_id} onChange={handleAddNewChange} className={inputStyle}>
                            <option value="">Select Karat</option>
                            {karats.map(k => <option key={k.karat_id} value={k.karat_id}>{k.karat_name}</option>)}
                        </select>
                    </td>
                    <td className={cellStyle}>
                        <input type="number" name="today_rate" value={newRateData.today_rate} onChange={handleAddNewChange} step="0.01" className={inputStyle} placeholder="Enter rate"/>
                    </td>
                    <td className={`${cellStyle} text-center`}>
                        <button onClick={handleAddNewSubmit} className="flex items-center justify-center w-full bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500">
                            <PlusIcon className="h-5 w-5 mr-2" /> Add
                        </button>
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}