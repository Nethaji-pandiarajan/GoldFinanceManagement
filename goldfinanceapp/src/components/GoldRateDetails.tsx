import React, { useState, useEffect } from "react";
import api from "../api";
import AlertNotification from "./AlertNotification";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/solid";


type AlertState = { show: boolean; type: "success" | "error" | "alert"; message: string; } | null;

interface RateRow {
  karat_id: number;
  karat_name: string;
  rate_id: number | null;
  today_rate: string;
}

export default function GoldRateDetails() {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/gold-rates`);
      const formattedData = response.data.map((row: any) => ({
        ...row,
        today_rate: row.today_rate ? String(row.today_rate) : '',
      }));
      setRates(formattedData);
    } catch (error) {
      setAlert({ show: true, type: "error", message: "Failed to fetch data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleEditClick = (karatId: number) => {
    setEditingRowId(karatId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, karatId: number) => {
    const updatedRates = rates.map((rate) =>
      rate.karat_id === karatId ? { ...rate, today_rate: e.target.value } : rate
    );
    setRates(updatedRates);
  };

  const handleSave = async (karatId: number) => {
    const rateToSave = rates.find((r) => r.karat_id === karatId);
    if (!rateToSave || !rateToSave.today_rate) {
      setAlert({ show: true, type: 'alert', message: 'Please enter a valid rate.' });
      return;
    }

    setLoading(true);
    try {
      if (rateToSave.rate_id) {
        await api.put(`/api/gold-rates/${rateToSave.rate_id}`, {
          today_rate: rateToSave.today_rate,
        });
        setAlert({ show: true, type: "success", message: "Rate updated successfully!" });
      } else {
        await api.post(`/api/gold-rates`, {
          karat_id: rateToSave.karat_id,
          today_rate: rateToSave.today_rate,
        });
        setAlert({ show: true, type: "success", message: "Rate added successfully!" });
      }
      setEditingRowId(null);
      fetchRates();
    } catch (error) {
      setAlert({ show: true, type: "error", message: "Failed to save rate." });
    } finally {
      setLoading(false);
    }
  };

  const cellStyle = "p-3";
  const inputStyle = "w-full h-11 p-2 rounded bg-[#1f2628] text-white border border-gray-600 focus:outline-none focus:border-[#c69909]";
  const buttonStyle = "flex items-center justify-center w-full bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50";

  return (
    <>
      {alert?.show && ( <AlertNotification {...alert} onClose={() => setAlert(null)} /> )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#c69909]">Manage Gold Rates</h1>
            <button onClick={fetchRates} disabled={loading} className="px-4 py-2 text-sm bg-gray-700/50 rounded-lg hover:bg-gray-600 disabled:opacity-50">
                {loading ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="border-b-2 border-[#c69909]">
              <tr>
                <th className={`${cellStyle} w-1/3 text-white`}>Karat Name</th>
                <th className={`${cellStyle} w-1/3 text-white`}>Today's Rate (per gram)</th>
                <th className={`${cellStyle} w-1/3 text-white text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const isEditing = editingRowId === rate.karat_id;
                const hasExistingRate = !!rate.rate_id;

                return (
                  <tr key={rate.karat_id} className="border-b border-gray-800">
                    <td className={`${cellStyle} text-gray-300 font-semibold`}>{rate.karat_name}</td>
                    <td className={cellStyle}>
                      {isEditing || !hasExistingRate ? (
                        <input
                          type="number"
                          step="0.01"
                          value={rate.today_rate}
                          onChange={(e) => handleInputChange(e, rate.karat_id)}
                          className={inputStyle}
                          placeholder="Enter rate..."
                          autoFocus
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault();
                            }
                          }}
                        />
                      ) : (
                        <span onClick={() => handleEditClick(rate.karat_id)} className="cursor-pointer p-2 text-white hover:bg-[#1f2628] rounded-md">
                          ₹{parseFloat(rate.today_rate).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className={`${cellStyle} text-center`}>
                      {isEditing || !hasExistingRate ? (
                        <button onClick={() => handleSave(rate.karat_id)} className={buttonStyle} disabled={loading}>
                          {hasExistingRate ? <CheckIcon className="h-5 w-5 mr-2"/> : <PlusIcon className="h-5 w-5 mr-2"/>}
                          {hasExistingRate ? 'Update' : 'Add Rate'}
                        </button>
                      ) : (
                        <div className="h-11"></div> 
                      )}
                    </td>
                  </tr>
                )
              })}
               {loading && rates.length === 0 && (
                    <tr><td colSpan={3} className="text-center p-8 text-gray-400">Loading Karats...</td></tr>
               )}
               {!loading && rates.length === 0 && (
                    <tr><td colSpan={3} className="text-center p-8 text-gray-400">No karats found. Please add karat details first.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}