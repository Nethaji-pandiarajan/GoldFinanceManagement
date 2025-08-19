import React, { useState, useEffect } from "react";
import api from "../api";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

interface Slab {
    start_day: string;
    end_day: string;
    interest_rate: string;
}
interface ApiSlab {
    slab_id: number;
    scheme_id: number;
    start_day: number;
    end_day: number;
    interest_rate: string;
}
interface EditSchemeFormProps {
  schemeId: number;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
}
export default function EditSchemeForm({ schemeId, onClose, onSuccess, setAlert } : EditSchemeFormProps) {
  const [formData, setFormData] = useState({ scheme_name: "", description: "" });
  const [slabs, setSlabs] = useState<Slab[]>([{ start_day: '', end_day: '', interest_rate: '' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemeData = async () => {
      try {
        const response = await api.get(`/api/schemes/${schemeId}`);
        setFormData({ scheme_name: response.data.scheme_name, description: response.data.description || "" });
        const fetchedSlabs = response.data.slabs.map((s: ApiSlab) => ({ 
            start_day: String(s.start_day), 
            end_day: String(s.end_day), 
            interest_rate: String(s.interest_rate) 
        }));
        setSlabs(fetchedSlabs.length > 0 ? fetchedSlabs : [{ start_day: '', end_day: '', interest_rate: '' }]);
      } catch (error) {
        setAlert({ show: true, type: 'error', message: 'Failed to fetch scheme details.' });
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchSchemeData();
  }, [schemeId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSlabChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const values: Slab[] = [...slabs];
    const name = event.target.name;
    const key = name as keyof Slab;
    values[index][key] = event.target.value;
    setSlabs(values);
  };

  const addSlabField = () => setSlabs([...slabs, { start_day: '', end_day: '', interest_rate: '' }]);
  const removeSlabField = (index: number) => {
    if (slabs.length > 1) {
      const values = [...slabs];
      values.splice(index, 1);
      setSlabs(values);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const submissionData = { ...formData, slabs };
    try {
      await api.put(`/api/schemes/${schemeId}`, submissionData);
      onSuccess();
    } catch (err: any) {
      setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to update scheme.' });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  
  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";

  if (loading) {
    return <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50"><p className="text-white">Loading Scheme Details...</p></div>
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
        <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
            <h2 className="text-2xl font-bold text-[#c69909] mb-6">Edit Scheme & Interest Slabs</h2>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div><label className={labelStyle}>Scheme Name*</label><input type="text" name="scheme_name" value={formData.scheme_name} onChange={handleFormChange} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Description</label><textarea name="description" value={formData.description} onChange={handleFormChange} className={inputStyle} rows={3}></textarea></div>
                </div>

                <h3 className="text-lg font-semibold text-white mt-8 mb-2 border-b border-gray-700 pb-1">Interest Rate Slabs</h3>
                {slabs.map((slab, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center mb-2">
                        <div><label className="text-xs text-gray-400">Start Day*</label><input type="number" name="start_day" placeholder="e.g., 1" value={slab.start_day} onChange={e => handleSlabChange(index, e)} required className={inputStyle}/></div>
                        <div><label className="text-xs text-gray-400">End Day*</label><input type="number" name="end_day" placeholder="e.g., 90" value={slab.end_day} onChange={e => handleSlabChange(index, e)} required className={inputStyle}/></div>
                        <div><label className="text-xs text-gray-400">Rate (%)*</label><input type="number" step="0.01" name="interest_rate" placeholder="e.g., 12.5" value={slab.interest_rate} onChange={e => handleSlabChange(index, e)} required className={inputStyle}/></div>
                        <button type="button" onClick={() => removeSlabField(index)} disabled={slabs.length <= 1} className="p-2 mt-5 text-red-400 hover:text-white rounded-full hover:bg-red-500/20 disabled:opacity-30"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                ))}
                <button type="button" onClick={addSlabField} className="flex items-center mt-3 text-sm text-[#c69909] font-semibold hover:text-white"><PlusIcon className="h-5 w-5 mr-1"/> Add Slab</button>
                
                <div className="flex justify-end space-x-4 mt-8">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500" disabled={loading}>Cancel</button>
                    <button type="submit" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Scheme'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}