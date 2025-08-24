import React, { useState, useEffect } from "react";
import api from "../api";

type AlertState = { show: boolean; type: "success" | "error" | "alert"; message: string; } | null;

type AddGoldKaratFormProps = {
  mode: "add" | "edit";
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
  availableOptions: string[];
};

export default function AddGoldKaratForm({ mode, initialData, onClose, onSuccess, setAlert  , availableOptions}: AddGoldKaratFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    purity: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedKarat, setSelectedKarat] = useState("");
  const [customKaratName, setCustomKaratName] = useState("");
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        description: initialData.description || "",
        purity: initialData.purity || "",
      });
      const isPredefined = availableOptions.includes(initialData.karat_name);
      if (isPredefined) {
        setSelectedKarat(initialData.karat_name);
      } else {
        setSelectedKarat("Others");
        setCustomKaratName(initialData.karat_name || "");
      }
    }
  }, [mode, initialData , availableOptions  ]);

  useEffect(() => {
    if (mode === 'add') {
      if (selectedKarat && selectedKarat !== "Others") {
        const karatValue = parseInt(selectedKarat, 10);
        
        if (!isNaN(karatValue)) {
          const calculatedPurity = (karatValue / 24) * 100;
          setFormData(prevData => ({
            ...prevData,
            purity: calculatedPurity.toFixed(2),
          }));
        }
      } else if (selectedKarat === "Others") {
        setFormData(prevData => ({ ...prevData, purity: "" }));
      }
    }
  }, [selectedKarat, mode]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalKaratName = selectedKarat === "Others" ? customKaratName : selectedKarat;
    if (!finalKaratName) {
      setAlert({ show: true, type: "error", message: "Karat Name is required." });
      setLoading(false);
      return;
    }

    const submissionData = {
      ...formData,
      ...(mode === 'add' && { karat_name: finalKaratName }),
    };
    
    try {
      if (mode === "edit") {
        await api.put(`/api/karats/${initialData.karat_id}`, submissionData);
      } else {
        await api.post(`/api/karats`, submissionData);
      }
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${mode} karat detail.`;
      setAlert({ show: true, type: "error", message: errorMessage });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  
  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]";
  const disabledInputStyle = "bg-black/20 cursor-not-allowed text-gray-400";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">
          {mode === "edit" ? "Edit Gold Karat" : "Add New Gold Karat"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Karat Name*</label>
              <select 
                value={selectedKarat} 
                onChange={(e) => setSelectedKarat(e.target.value)} 
                className={`${inputStyle} ${mode === 'edit' ? disabledInputStyle : ''}`} 
                required
                disabled={mode === 'edit'}
              >
                <option value="">Select a Karat</option>
                {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {selectedKarat === 'Others' && (
              <div>
                <label className={labelStyle}>Custom Karat Name*</label>
                <input 
                  type="text" 
                  value={customKaratName} 
                  onChange={(e) => setCustomKaratName(e.target.value)} 
                  className={`${inputStyle} ${mode === 'edit' ? disabledInputStyle : ''}`} 
                  required 
                  placeholder="e.g., 9K, Custom Alloy" 
                  disabled={mode === 'edit'}
                />
              </div>
            )}
            <div>
              <label className={labelStyle}>Purity (%)*</label>
              <input
                type="number"
                name="purity"
                value={formData.purity}
                onChange={handleChange}
                className={`${inputStyle} ${selectedKarat !== 'Others' && mode === 'add' ? disabledInputStyle : ''}`}
                placeholder={selectedKarat !== 'Others' && mode === 'add' ? 'Auto-calculated' : 'e.g., 91.60'}
                step="0.01"
                readOnly={selectedKarat !== 'Others' && mode === 'add'}
              />
            </div>

            <div>
              <label className={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className={inputStyle} rows={3}></textarea>
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-8">
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
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Karat"
                : "Save Karat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
