import { useState, useEffect, useMemo } from "react";
import api from "../api";
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon, XCircleIcon, EyeIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import SearchableDropdown from "./SearchableDropdown";
import LoanCalculatorWidget from "./LoanCalculatorWidget";
import LoanConfirmationModal from "./LoanConfirmationModal";
import ImageViewerModal from "./ImageViewerModal";

const bufferToBase64 = (buffer: { type: string; data: number[] } | null | undefined): string | null => {
  if (!buffer || buffer.type !== "Buffer" || !buffer.data) return null;
  const binary = new Uint8Array(buffer.data).reduce((data, byte) => data + String.fromCharCode(byte), "");
  return `data:image/jpeg;base64,${btoa(binary)}`;
};

const formatCurrency = (value: string | number) => {
    const num = parseFloat(String(value));
    if (isNaN(num)) return '₹ 0.00';
    return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface LoanDetails {
  loan_id: string;
  processing_fee: string;
  customer_id: string;
  nominee_id: string; 
  interest_rate: string;
  due_date: string;
  loan_date: string;
  loan_time: string;
  eligible_amount: string;
  amount_issued: string;
  loan_application_uuid: string;
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
interface CustomerDisplayDetails {
  customer_uuid: string;
  gender: string;
  date_of_birth: string;
  customer_image: any;
  nominee_name: string;
  nominee_mobile: string;
  address: string;
}
interface CalculationData {
  goldRates: { karat_name: string; today_rate: string; }[];
  karatLTVs: { karat_name: string; loan_to_value: string; }[];
}

const initialLoanDetails = (id: string): LoanDetails => ({
  loan_id: id, loan_application_uuid: uuidv4(), customer_id: "", nominee_id: "", interest_rate: "", due_date: "",
  loan_date: "", loan_time: "", eligible_amount: "0", amount_issued: "0", processing_fee: "100",
});
const initialOrnamentRow = (): OrnamentRow => ({
  key: Date.now(), ornament_type: "", ornament_name: "", material_type: "",
  grams: "", karat: "", ornament_image: null, image_preview: null
});
const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
    <h3 className="text-xl font-semibold text-white">{title}</h3>
  </div>
);

export default function NewLoanApplication() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(initialLoanDetails('Loading...'));
  const [ornamentRows, setOrnamentRows] = useState<OrnamentRow[]>([initialOrnamentRow()]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDisplayDetails, setCustomerDisplayDetails] = useState<CustomerDisplayDetails | null>(null);
  const [calculationData, setCalculationData] = useState<CalculationData>({ goldRates: [], karatLTVs: [] });
  const [masterOrnamentList, setMasterOrnamentList] = useState<any[]>([]);
  const [karatTypes, setKaratTypes] = useState<any[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [usePermanentAddress, setUsePermanentAddress] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [nextIdRes, calcDataRes, custRes, ornRes] = await Promise.all([
          api.get('/api/loans/next-id'),
          api.get('/api/loans/calculation-data'),
          api.get(`/api/customers-list`), 
          api.get(`/api/ornaments/all`),
        ]);
        setLoanDetails(initialLoanDetails(nextIdRes.data.next_id));
        setCalculationData(calcDataRes.data);
        setCustomers(custRes.data);
        setMasterOrnamentList(ornRes.data);
        setKaratTypes(calcDataRes.data.karatLTVs.map((k: any) => ({ karat_name: k.karat_name })));
      } catch (error) {
        setAlert({ show: true, type: "error", message: "Failed to load initial form data." });
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomer  && selectedCustomer.uuid) {
      const fetchCustomerDetails = async () => {
        try {
          const res = await api.get(`/api/customers/${selectedCustomer.uuid}`);
          const customerData = res.data;
          setCustomerDisplayDetails(customerData);
          setLoanDetails(prev => ({ ...prev, customer_id: selectedCustomer.id, nominee_id: customerData.nominee_id }));
          const permanentAddr = customerData.address || "";
          const currentAddr = customerData.current_address || "";
          if (currentAddr) {
            setCurrentAddress(currentAddr);
            setUsePermanentAddress(false);
          } else {
            setCurrentAddress(permanentAddr);
            setUsePermanentAddress(true);
          }
        } catch (error) {
          console.error("Failed to fetch customer details", error);
          setCustomerDisplayDetails(null);
          setCurrentAddress("");
        }
      };
      fetchCustomerDetails();
    } else {
      setCustomerDisplayDetails(null);
      setCurrentAddress("");
      setUsePermanentAddress(false);
      setLoanDetails(prev => ({ ...prev, customer_id: '', nominee_id: '' }));
    }
  }, [selectedCustomer]);
    useEffect(() => {
    if (usePermanentAddress) {
      setCurrentAddress(customerDisplayDetails?.address || "");
    }
  }, [usePermanentAddress]);
  const handleCurrentAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAddress(e.target.value);
    setUsePermanentAddress(false);
  };
  const calculatedEligibleAmount = useMemo(() => {
    return ornamentRows.reduce((total, ornament) => {
      if (!ornament.grams || !ornament.karat || isNaN(parseFloat(ornament.grams))) return total;
      const rateInfo = calculationData.goldRates.find(r => r.karat_name === ornament.karat);
      const ltvInfo = calculationData.karatLTVs.find(k => k.karat_name === ornament.karat);
      if (!rateInfo || !ltvInfo) return total;
      const ornamentValue = parseFloat(ornament.grams) * parseFloat(rateInfo.today_rate) * (parseFloat(ltvInfo.loan_to_value) / 100);
      return total + ornamentValue;
    }, 0);
  }, [ornamentRows, calculationData]);

  useEffect(() => {
    setLoanDetails(prev => ({ ...prev, eligible_amount: calculatedEligibleAmount.toFixed(2) }));
  }, [calculatedEligibleAmount]);

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => { setLoanDetails({ ...loanDetails, [e.target.name]: e.target.value }); };
  const handleOrnamentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updatedRows = [...ornamentRows];
    updatedRows[index] = { ...updatedRows[index], [e.target.name]: e.target.value };
    setOrnamentRows(updatedRows);
  };
  const handleOrnamentFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedRows = [...ornamentRows]; const file = e.target.files?.[0] || null;
    if (updatedRows[index].image_preview) { URL.revokeObjectURL(updatedRows[index].image_preview!); }
    if(file) {
      updatedRows[index].ornament_image = file; updatedRows[index].image_preview = URL.createObjectURL(file);
    } else {
      updatedRows[index].ornament_image = null; updatedRows[index].image_preview = null;
    }
    setOrnamentRows(updatedRows);
  };
  const addOrnamentRow = () => setOrnamentRows([...ornamentRows, initialOrnamentRow()]);
  const removeOrnamentRow = (index: number) => {
    if (ornamentRows.length > 1) {
      const rowToRemove = ornamentRows[index]; if (rowToRemove.image_preview) { URL.revokeObjectURL(rowToRemove.image_preview); }
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
    if (validateForm()) {
        setConfirmModalOpen(true);
    }
  };
  
  const validateForm = (): boolean => {
    const requiredLoanFields: (keyof LoanDetails)[] = [
      "customer_id", "interest_rate", "loan_date", "loan_time", 
      "due_date", "eligible_amount", "amount_issued"
    ];
    for (const field of requiredLoanFields) {
        if (!loanDetails[field]) {
            setAlert({ show: true, type: 'error', message: `Please fill out the "${field.replace(/_/g, ' ')}" field.` });
            return false;
        }
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
    const finalLoanDetails = { ...loanDetails,current_address: currentAddress, loan_datetime: `${loanDetails.loan_date}T${loanDetails.loan_time || '00:00'}` };
    const submissionData = new FormData();
    submissionData.append("loanDetails", JSON.stringify(finalLoanDetails));
    const ornamentsForApi = ornamentRows.map(row => ({
      ornament_id: masterOrnamentList.find(o => o.ornament_name === row.ornament_name)?.ornament_id || null,
      ornament_type: row.ornament_type, ornament_name: row.ornament_name,material_type: row.material_type,
      grams: row.grams, karat: row.karat,
    }));
    submissionData.append("ornaments", JSON.stringify(ornamentsForApi));
    ornamentRows.forEach((ornament, index) => {
      if (ornament.ornament_image) { submissionData.append(`ornament_image_${index}`, ornament.ornament_image); }
    });
    try {
      const response = await api.post(`/api/loans`, submissionData);
      setAlert({ show: true, type: "success", message: response.data.message });
      setLoanDetails(initialLoanDetails(response.data.newLoanId + 1));
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
      {viewingImage && <ImageViewerModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
      <LoanCalculatorWidget 
        eligibleAmount={parseFloat(loanDetails.eligible_amount || '0')}
        amountIssued={parseFloat(loanDetails.amount_issued || '0')}
        interestRate={parseFloat(loanDetails.interest_rate || '0')}
        processingFee={parseFloat(loanDetails.processing_fee || '0')}
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
        customerDisplayDetails={customerDisplayDetails}
      />
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-6">New Loan Application</h1>
        <form onSubmit={handleOpenConfirmModal} className="space-y-8">
          
          <section><SectionHeader title="Loan Details" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className={labelStyle}>Loan ID</label><div className={`${inputStyle} bg-black/20 flex items-center text-gray-400 font-semibold`}>{loanDetails.loan_id}</div></div>
              <div><label className={labelStyle}>Processing Fee (₹)</label><input type="number" name="processing_fee" value={loanDetails.processing_fee} onChange={handleLoanChange} className={inputStyle} /></div>
              <div><label className={labelStyle}>Interest Rate (%)*</label><input type="number" name="interest_rate" value={loanDetails.interest_rate} onChange={handleLoanChange} className={inputStyle} step="0.01" required /></div>
          </div></section>

          <section><SectionHeader title="Loan Timeline" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className={labelStyle}>Loan Date*</label><input type="date" name="loan_date" value={loanDetails.loan_date} onChange={handleLoanChange} className={inputStyle} required /></div>
              <div><label className={labelStyle}>Loan Time*</label><input type="time" name="loan_time" value={loanDetails.loan_time} onChange={handleLoanChange} className={inputStyle} required /></div>
              <div><label className={labelStyle}>Due Date*</label><input type="date" name="due_date" value={loanDetails.due_date} onChange={handleLoanChange} className={inputStyle} required /></div>
          </div></section>

          <section><SectionHeader title="Customer Details" /><div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="md:col-span-2 space-y-4">
                  <div><label className={labelStyle}>Customer Name & Phone*</label><SearchableDropdown items={customers} selected={selectedCustomer} setSelected={setSelectedCustomer} placeholder="Search customers..." /></div>
                  <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelStyle}>Gender</label><div className={`${inputStyle} bg-black/20 flex items-center text-gray-400`}>{customerDisplayDetails?.gender || '...'}</div></div>
                      <div><label className={labelStyle}>Date of Birth</label><div className={`${inputStyle} bg-black/20 flex items-center text-gray-400`}>{customerDisplayDetails?.date_of_birth ? new Date(customerDisplayDetails.date_of_birth).toLocaleDateString() : '...'}</div></div>
                      <div><label className={labelStyle}>Nominee</label><div className={`${inputStyle} bg-black/20 flex items-center text-gray-400 truncate`} title={customerDisplayDetails ? `${customerDisplayDetails.nominee_name} (${customerDisplayDetails.nominee_mobile})` : ''}>{customerDisplayDetails ? `${customerDisplayDetails.nominee_name}` : '...'}</div></div>
                  </div>
              </div>
              <div className="flex flex-col items-center justify-center"><label className={labelStyle}>Customer Image</label><div className="w-40 h-48 bg-black/20 rounded-md flex items-center justify-center border border-gray-700">{customerDisplayDetails?.customer_image ? <img src={bufferToBase64(customerDisplayDetails.customer_image)} alt="Customer" className="w-full h-full object-cover rounded-md" /> : <span className="text-gray-500 text-sm">Select Customer</span>}</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                    <label className={labelStyle}>Permanent Address (from DB)</label>
                    <textarea value={customerDisplayDetails?.address || '...'} className={`${inputStyle} bg-black/20 cursor-not-allowed`} readOnly rows={3}></textarea>
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className={labelStyle}>Current Address</label>
                        <div className="flex items-center mb-2">
                            <input 
                                id="sameAsPermanent"
                                type="checkbox"
                                checked={usePermanentAddress}
                                onChange={(e) => setUsePermanentAddress(e.target.checked)}
                                className="h-4 w-4 rounded bg-[#1f2628] border-gray-600 text-[#c69909] focus:ring-[#c69909]"
                                disabled={!selectedCustomer}
                            />
                            <label htmlFor="sameAsPermanent" className="ml-2 text-sm text-gray-300">Same as permanent</label>
                        </div>
                    </div>
                    <textarea 
                        value={currentAddress} 
                        onChange={handleCurrentAddressChange}
                        className={inputStyle} 
                        rows={3}
                        placeholder={selectedCustomer ? "Enter current address..." : "Select a customer first"}
                        disabled={!selectedCustomer}
                    ></textarea>
                </div>
            </div>
          </section>
          
          <section><SectionHeader title="Ornament Details" /><div className="space-y-4">
            <div className="flex justify-end"><button type="button" onClick={addOrnamentRow} className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"><PlusIcon className="h-5 w-5 mr-2" /> Add Ornament</button></div>
            {ornamentRows.map((ornament, index) => (
              <div key={ornament.key} className="relative p-4 pt-10 border border-gray-700/50 rounded-lg">
                <button 
                  type="button" 
                  onClick={() => clearOrnamentRow(index)} 
                  className="absolute top-2 right-2 flex items-center text-gray-400 font-semibold hover:text-red-400 text-xs transition-colors z-10"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" /> Clear Row
                </button>
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_2.5fr_1fr_1fr] gap-x-4 gap-y-4 mb-4">
                    <div><label className={labelStyle}>Material*</label><select name="material_type" value={ornament.material_type} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.map(o => o.material_type))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Type*</label><select name="ornament_type" value={ornament.ornament_type} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.filter(o => !ornament.material_type || o.material_type === ornament.material_type).map(o => o.ornament_type))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Name*</label><select name="ornament_name" value={ornament.ornament_name} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{[...new Set(masterOrnamentList.filter(o => (!ornament.material_type || o.material_type === ornament.material_type) && (!ornament.ornament_type || o.ornament_type === ornament.ornament_type)).map(o => o.ornament_name))].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelStyle}>Grams*</label><input type="number" name="grams" value={ornament.grams} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} placeholder="0.00" step="0.01" required /></div>
                    <div><label className={labelStyle}>Karat*</label><select name="karat" value={ornament.karat} onChange={(e) => handleOrnamentChange(index, e)} className={inputStyle} required><option value="">Select</option>{karatTypes.map((k) => (<option key={k.karat_name} value={k.karat_name}>{k.karat_name}</option>))}</select></div>
                </div>
                <div className="relative flex items-center justify-center">
                    <div className="w-full h-48 bg-black/20 rounded-md flex items-center justify-center border border-gray-700 p-2">
                        {ornament.image_preview ? <img src={ornament.image_preview} alt="Ornament Preview" className="max-w-full max-h-full object-contain rounded-md" /> : 
                        <div><label htmlFor={`file-upload-${index}`} className="cursor-pointer text-gray-400 p-4 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-colors">Upload Image</label><input id={`file-upload-${index}`} type="file" onChange={(e) => handleOrnamentFileChange(index, e)} className="hidden" /></div>}
                    </div>
                     <div className="absolute top-2 right-2 flex items-center gap-2">
                        {ornamentRows.length > 1 && <button type="button" title="Remove this row" onClick={() => removeOrnamentRow(index)} className="p-2 text-red-400 hover:text-white rounded-full bg-black/20 hover:bg-red-500/10"><TrashIcon className="h-5 w-5" /></button>}
                     </div>
                </div>
              </div>
            ))}
          </div></section>

          <section><SectionHeader title="Final Amounts" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={labelStyle}>Eligible Amount (₹)</label><div className={`${inputStyle} bg-black/20 flex items-center font-bold text-lg text-green-300`}>{formatCurrency(loanDetails.eligible_amount)}</div></div>
              <div><label className={labelStyle}>Amount Issued (₹)*</label><input type="number" name="amount_issued" value={loanDetails.amount_issued} onChange={handleLoanChange} className={inputStyle} step="0.01" required /></div>
          </div></section>

          <div className="flex justify-end mt-8"><button type="submit" className="flex items-center justify-center bg-[#c69909] text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500" disabled={loading}>Review & Submit</button></div>
        </form>
      </div>
    </div>
  );
}