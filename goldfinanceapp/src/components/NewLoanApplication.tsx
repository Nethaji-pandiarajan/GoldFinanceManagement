import { useState, useEffect } from "react";
import axios from "axios";
import { PlusIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import SearchableDropdown from "./SearchableDropdown";
import LoanCalculatorWidget from "./LoanCalculatorWidget";
import LoanConfirmationModal from "./LoanConfirmationModal";
import { v4 as uuidv4 } from 'uuid';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type AlertState = { show: boolean; type: "success" | "error" | "alert"; message: string; } | null;

interface LoanDetails {
  loan_application_uuid: string;
  customer_id: string;
  nominee_id: string;
  interest_rate: string;
  due_date: string;
  loan_date: string;
  loan_time: string;
  eligible_amount: string;
  amount_issued: string;
}

interface OrnamentRow {
  key: number;
  ornament_type: string;
  ornament_name: string;
  material_type: string;
  grams: string;
  karat: string;
  ornament_image: File | null;
  image_preview: string | null;
}

const generateInitialLoanDetails = (): LoanDetails => ({
  loan_application_uuid: uuidv4(),
  customer_id: "", nominee_id: "", interest_rate: "", due_date: "",
  loan_date: "", loan_time: "", eligible_amount: "0", amount_issued: "0",
});

const initialOrnamentRow = (): OrnamentRow => ({
  key: Date.now(),
  ornament_type: "", ornament_name: "", material_type: "",
  grams: "", karat: "", ornament_image: null, image_preview: null
});


const SectionHeader = ({ title, onClear }: { title: string; onClear: () => void }) => (
  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <button type="button" onClick={onClear} className="flex items-center text-gray-400 font-semibold hover:text-red-400 text-xs transition-colors">
      <XCircleIcon className="h-4 w-4 mr-1" /> Clear Section
    </button>
  </div>
);

export default function NewLoanApplication() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(generateInitialLoanDetails());
  const [ornamentRows, setOrnamentRows] = useState<OrnamentRow[]>([initialOrnamentRow()]);
  
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allNominees, setAllNominees] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedNominee, setSelectedNominee] = useState<any | null>(null);
  const [masterOrnamentList, setMasterOrnamentList] = useState<any[]>([]);
  const [karatTypes, setKaratTypes] = useState<any[]>([]);
  
  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [custRes, ornRes, karRes, nomRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/customers-list`),
          axios.get(`${API_BASE_URL}/api/ornaments/all`),
          axios.get(`${API_BASE_URL}/api/karats/list`),
          axios.get(`${API_BASE_URL}/api/nominees-list`),
        ]);
        setAllCustomers(custRes.data);
        setMasterOrnamentList(ornRes.data);
        setKaratTypes(karRes.data);
        setAllNominees(nomRes.data);
      } catch (error) {
        setAlert({ show: true, type: "error", message: "Failed to load required form data." });
      }
    };
    fetchDropdownData();
  }, []);

  const handleCustomerSelect = (customer: any | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      const relatedNominee = allNominees.find(n => n.id === customer.nominee_id);
      setSelectedNominee(relatedNominee || null);
      setLoanDetails(prev => ({ ...prev, customer_id: customer.id, nominee_id: relatedNominee?.id || '' }));
    } else {
      // If customer is cleared, clear the nominee too
      setSelectedNominee(null);
      setLoanDetails(prev => ({ ...prev, customer_id: '', nominee_id: '' }));
    }
  };
  const handleNomineeSelect = (nominee: any | null) => {
    setSelectedNominee(nominee);
    if (nominee) {
      const relatedCustomer = allCustomers.find(c => c.nominee_id === nominee.id);
      setSelectedCustomer(relatedCustomer || null);
      setLoanDetails(prev => ({ ...prev, nominee_id: nominee.id, customer_id: relatedCustomer?.id || '' }));
    } else {
      setSelectedCustomer(null);
      setLoanDetails(prev => ({ ...prev, nominee_id: '', customer_id: '' }));
    }
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoanDetails({ ...loanDetails, [e.target.name]: e.target.value });
  };
  
  const handleOrnamentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedRows = [...ornamentRows];
    updatedRows[index] = { ...updatedRows[index], [name]: value };
    setOrnamentRows(updatedRows);
  };
  
  const handleOrnamentFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedRows = [...ornamentRows];
    const file = e.target.files?.[0] || null;

    if (updatedRows[index].image_preview) {
        URL.revokeObjectURL(updatedRows[index].image_preview!);
    }
    
    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setAlert({ show: true, type: "error", message: "File size cannot exceed 5MB." });
        e.target.value = '';
        updatedRows[index].ornament_image = null;
        updatedRows[index].image_preview = null;
      } else {
        updatedRows[index].ornament_image = file;
        updatedRows[index].image_preview = URL.createObjectURL(file);
      }
    } else {
      updatedRows[index].ornament_image = null;
      updatedRows[index].image_preview = null;
    }
    setOrnamentRows(updatedRows);
  };

  const addOrnamentRow = () => setOrnamentRows([...ornamentRows, initialOrnamentRow()]);
  
  const removeOrnamentRow = (index: number) => {
    if (ornamentRows.length > 1) {
      const rowToRemove = ornamentRows[index];
      if (rowToRemove.image_preview) { URL.revokeObjectURL(rowToRemove.image_preview); }
      setOrnamentRows(ornamentRows.filter((_, i) => i !== index));
    }
  };
  
  const clearOrnamentRow = (index: number) => {
    const updatedRows = [...ornamentRows];
    if (updatedRows[index].image_preview) { URL.revokeObjectURL(updatedRows[index].image_preview!); }
    updatedRows[index] = { ...initialOrnamentRow(), key: updatedRows[index].key };
    setOrnamentRows(updatedRows);
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setConfirmModalOpen(true);
  };

  const validateForm = (): boolean => {
    const requiredLoanFields: (keyof LoanDetails)[] = ['customer_id', 'nominee_id', 'interest_rate', 'loan_date', 'loan_time', 'due_date', 'eligible_amount', 'amount_issued'];
    for (const field of requiredLoanFields) {
        if (!loanDetails[field as keyof LoanDetails]) {
            const fieldName = field.replace(/_/g, ' ');
            setAlert({ show: true, type: 'error', message: `Please fill out the "${fieldName}" field.` });
            return false;
        }
    }
    if (parseFloat(loanDetails.amount_issued) > parseFloat(loanDetails.eligible_amount)) {
        setAlert({ show: true, type: 'error', message: 'Amount Issued cannot be greater than the Eligible Amount.' });
        return false;
    }
    for (const [index, ornament] of ornamentRows.entries()) {
        if (!ornament.material_type || !ornament.ornament_type || !ornament.ornament_name || !ornament.grams || !ornament.karat) {
            setAlert({ show: true, type: 'error', message: `Please fill out all fields for Ornament #${index + 1}.` });
            return false;
        }
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const finalLoanDetails = { ...loanDetails, loan_datetime: `${loanDetails.loan_date}T${loanDetails.loan_time || '00:00'}` };
    const submissionData = new FormData();
    submissionData.append("loanDetails", JSON.stringify(finalLoanDetails));
    const ornamentsForApi = ornamentRows.map(row => ({
        ornament_id: masterOrnamentList.find(o => o.ornament_name === row.ornament_name)?.ornament_id || null,
        ornament_type: row.ornament_type, ornament_name: row.ornament_name,
        grams: row.grams, karat: row.karat,
    }));
    submissionData.append("ornaments", JSON.stringify(ornamentsForApi));
    ornamentRows.forEach((ornament, index) => {
      if (ornament.ornament_image) { submissionData.append(`ornament_image_${index}`, ornament.ornament_image); }
    });
    try {
      await axios.post(`${API_BASE_URL}/api/loans`, submissionData, { headers: { "Content-Type": "multipart/form-data" } });
      setAlert({ show: true, type: "success", message: "Loan application created successfully!" });
      setLoanDetails(generateInitialLoanDetails());
      setOrnamentRows([initialOrnamentRow()]);
      setSelectedCustomer(null);
      setConfirmModalOpen(false);
    } catch (error) {
      setAlert({ show: true, type: "error", message: "Failed to create loan application." });
    } finally {
      setLoading(false);
    }
  };
  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";
  const inputStyle = `w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909] focus:ring-1 focus:ring-[#c69909]`;
  
  return (
    <div className="relative">
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      <LoanCalculatorWidget 
        eligibleAmount={parseFloat(loanDetails.eligible_amount || '0')}
        amountIssued={parseFloat(loanDetails.amount_issued || '0')}
        interestRate={parseFloat(loanDetails.interest_rate || '0')}
        startDate={loanDetails.loan_date}
        endDate={loanDetails.due_date}
      />
      <LoanConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSubmit}
        loanDetails={loanDetails}
        customer={selectedCustomer}
        ornaments={ornamentRows}
        loading={loading}
      />
      
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-6">New Loan Application</h1>
        <form onSubmit={handleOpenConfirmModal} className="space-y-8">
          
          <section>
            <SectionHeader title="Customer Details" onClear={() => { 
                handleCustomerSelect(null);
            }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>Application ID</label>
                <div className={`${inputStyle} bg-black/20 ...`}>
                  {loanDetails.loan_application_uuid}
                </div>
              </div>
              <div>
                <label className={labelStyle}>Customer*</label>
                <SearchableDropdown 
                  items={allCustomers} 
                  selected={selectedCustomer} 
                  setSelected={handleCustomerSelect}
                  placeholder="Search customers..." 
                />
              </div>
              <div>
                <label className={labelStyle}>Nominee*</label>
                <SearchableDropdown 
                  items={allNominees} 
                  selected={selectedNominee} 
                  setSelected={handleNomineeSelect}
                  placeholder="Search nominees..." 
                />
              </div>
            </div>
          </section>

          <section>
            <SectionHeader title="Loan Amount Details" onClear={() => setLoanDetails(prev => ({...prev, interest_rate: '', eligible_amount: '0', amount_issued: '0'}))} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div><label className={labelStyle}>Interest Rate (%)*</label><input type="number" name="interest_rate" value={loanDetails.interest_rate} onChange={handleLoanChange} className={inputStyle} placeholder="e.g., 12.5" step="0.01" required /></div>
               <div><label className={labelStyle}>Eligible Amount (₹)*</label><input type="number" name="eligible_amount" value={loanDetails.eligible_amount} onChange={handleLoanChange} className={inputStyle} placeholder="0.00" step="0.01" required /></div>
               <div><label className={labelStyle}>Amount Issued (₹)*</label><input type="number" name="amount_issued" value={loanDetails.amount_issued} onChange={handleLoanChange} className={inputStyle} placeholder="0.00" step="0.01" required /></div>
            </div>
          </section>

          <section>
            <SectionHeader title="Loan Timeline" onClear={() => setLoanDetails(prev => ({...prev, loan_date: '', loan_time: '', due_date: ''}))} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className={labelStyle}>Loan Date*</label><input type="date" name="loan_date" value={loanDetails.loan_date} onChange={handleLoanChange} className={inputStyle} required /></div>
              <div><label className={labelStyle}>Loan Time*</label><input type="time" name="loan_time" value={loanDetails.loan_time} onChange={handleLoanChange} className={inputStyle} required /></div>
              <div><label className={labelStyle}>Due Date*</label><input type="date" name="due_date" value={loanDetails.due_date} onChange={handleLoanChange} className={inputStyle} required /></div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Ornaments Pledged</h3>
              <button 
                type="button" 
                onClick={addOrnamentRow} 
                className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" /> Add
              </button>
            </div>
            <div className="relative border border-gray-700/50 rounded-lg p-4">
              <button 
                type="button" 
                onClick={() => setOrnamentRows([initialOrnamentRow()])} 
                className="absolute top-4 right-4 flex items-center text-gray-400 font-semibold hover:text-red-400 text-xs transition-colors z-10"
              >
                <XCircleIcon className="h-4 w-4 mr-1" /> Clear Section
              </button>
              <div className="space-y-4 pt-8">
                {ornamentRows.map((ornament, index) => (
                <div key={ornament.key} className="relative p-4 border border-gray-700/50 rounded-lg">
                  <div className="relative flex justify-between items-center mb-4 pb-2 border-b border-gray-700/50">
                    <h4 className="font-semibold text-gray-300">
                      Ornament #{index + 1}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => clearOrnamentRow(index)} 
                      className="flex items-center text-gray-400 font-semibold hover:text-red-400 text-xs transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" /> Clear Row
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_1fr_1fr] gap-x-4 gap-y-4 items-end">
                    <div><label className={labelStyle}>Material*</label><select name="material_type" value={ornament.material_type} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.map(o => o.material_type))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Type*</label><select name="ornament_type" value={ornament.ornament_type} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.filter(o => !ornament.material_type || o.material_type === ornament.material_type).map(o => o.ornament_type))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Name*</label><select name="ornament_name" value={ornament.ornament_name} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.filter(o => (!ornament.material_type || o.material_type === ornament.material_type) && (!ornament.ornament_type || o.ornament_type === ornament.ornament_type)).map(o => o.ornament_name))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Grams*</label><input type="number" name="grams" value={ornament.grams} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} placeholder="0.00" step="0.01" required /></div>
                    <div><label className={labelStyle}>Karat*</label><select name="karat" value={ornament.karat} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{karatTypes.map((k) => (<option key={k.karat_id} value={k.karat_name}>{k.karat_name}</option>))}</select></div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 mt-4">
                     <div><label className={labelStyle}>Image</label><input type="file" name="ornament_image" onChange={(e) => handleOrnamentFileChange(index, e)} className="h-12 w-full text-sm text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#c69909]/80 file:text-black hover:file:bg-yellow-500" /></div>
                     <div className="flex items-end justify-between">
                       {ornamentRows.length > 1 && (
                        <button 
                          type="button" 
                          title="Remove this row" 
                          onClick={() => removeOrnamentRow(index)} 
                          className="absolute bottom-4 right-4 p-2 text-red-400 hover:text-white rounded-full hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                     </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-8">
            <button type="submit" className="flex items-center justify-center bg-[#c69909] text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors text-base" disabled={loading}>
              Review & Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
