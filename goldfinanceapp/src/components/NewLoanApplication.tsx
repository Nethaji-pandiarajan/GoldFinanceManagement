// src/components/NewLoanApplication.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { PlusIcon, TrashIcon , XCircleIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;
const initialLoanDetails = {
  customer_id: "", interest_rate: "", due_date: "",
  loan_datetime: "", eligible_amount: "", amount_issued: "",
};
const initialOrnamentRow: OrnamentRow = {
  key: Date.now(),
  ornament_type: "",
  ornament_name: "",
  material_type: "",
  grams: "",
  karat: "",
  ornament_image: null,
  uploadStatus: "idle",
};
interface LoanDetails {
  customer_id: string;
  interest_rate: string;
  due_date: string;
  loan_datetime: string;
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
  uploadStatus: "idle" | "uploading" | "uploaded";
}

export default function NewLoanApplication() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    customer_id: "",
    interest_rate: "",
    due_date: "",
    loan_datetime: "",
    eligible_amount: "",
    amount_issued: "",
  });
  const [ornamentRows, setOrnamentRows] = useState<OrnamentRow[]>([
    {
      key: Date.now(),
      ornament_type: "",
      ornament_name: "",
      material_type: "",
      grams: "",
      karat: "",
      ornament_image: null,
      uploadStatus: "idle",
    },
  ]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [masterOrnamentList, setMasterOrnamentList] = useState<any[]>([]);
  const [karatTypes, setKaratTypes] = useState<any[]>([]);

  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [custRes, ornRes, karRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/customers-list`),
          axios.get(`${API_BASE_URL}/api/ornaments/all`),
          axios.get(`${API_BASE_URL}/api/karats/list`),
        ]);
        setCustomers(custRes.data);
        setMasterOrnamentList(ornRes.data);
        setKaratTypes(karRes.data);
      } catch (error) {
        setAlert({
          show: true,
          type: "error",
          message: "Failed to load required form data.",
        });
      }
    };
    fetchDropdownData();
  }, []);

  const handleLoanChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setLoanDetails({ ...loanDetails, [e.target.name]: e.target.value });
  };

  const handleOrnamentChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedRows = [...ornamentRows];
    const currentRow = { ...updatedRows[index], [name]: value };
    const potentialMatches = masterOrnamentList.filter(
      (o) =>
        (!currentRow.ornament_type ||
          o.ornament_type === currentRow.ornament_type) &&
        (!currentRow.ornament_name ||
          o.ornament_name === currentRow.ornament_name) &&
        (!currentRow.material_type ||
          o.material_type === currentRow.material_type)
    );

    if (potentialMatches.length === 1) {
      const match = potentialMatches[0];
      currentRow.ornament_type = match.ornament_type;
      currentRow.ornament_name = match.ornament_name;
      currentRow.material_type = match.material_type;
    }

    updatedRows[index] = currentRow;
    setOrnamentRows(updatedRows);
  };

  const handleOrnamentFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedRows = [...ornamentRows];
    const file = e.target.files?.[0] || null;
    updatedRows[index].ornament_image = null;
    updatedRows[index].uploadStatus = "idle";

    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setAlert({
          show: true,
          type: "error",
          message: "File size cannot exceed 5MB.",
        });
        e.target.value = "";
      } else {
        updatedRows[index].ornament_image = file;
        updatedRows[index].uploadStatus = "uploaded";
      }
    }
    setOrnamentRows(updatedRows);
  };

  const addOrnamentRow = () => {
    setOrnamentRows([
      ...ornamentRows,
      {
        key: Date.now(),
        ornament_type: "",
        ornament_name: "",
        material_type: "",
        grams: "",
        karat: "",
        ornament_image: null,
        uploadStatus: "idle",
      },
    ]);
  };

  const removeOrnamentRow = (index: number) => {
    if (ornamentRows.length > 1) {
      setOrnamentRows(ornamentRows.filter((_, i) => i !== index));
    }
  };
    const clearLoanDetails = () => {
    setLoanDetails(initialLoanDetails);
  };
  const clearOrnamentRow = (index: number) => {
    const updatedRows = [...ornamentRows];
    updatedRows[index] = { ...initialOrnamentRow, key: updatedRows[index].key };
    setOrnamentRows(updatedRows);
  };
  const validateForm = (): boolean => {
    const requiredLoanFields: (keyof LoanDetails)[] = ['customer_id', 'interest_rate', 'due_date', 'loan_datetime', 'eligible_amount', 'amount_issued'];
    for (const field of requiredLoanFields) {
      if (!loanDetails[field]) {
        setAlert({ show: true, type: 'error', message: `Please fill out the "${field.replace('_', ' ')}" in the Loan Information section.` });
        return false;
      }
    }
    if (parseFloat(loanDetails.amount_issued) > parseFloat(loanDetails.eligible_amount)) {
      setAlert({ show: true, type: 'error', message: 'Amount Issued cannot be greater than the Eligible Amount.' });
      return false;
    }
    for (const [index, ornament] of ornamentRows.entries()) {
      const requiredOrnamentFields: (keyof Omit<OrnamentRow, 'ornament_image' | 'key' | 'uploadStatus'>)[] = ['ornament_type', 'ornament_name', 'material_type', 'grams', 'karat'];
      for (const field of requiredOrnamentFields) {
        if (!ornament[field]) {
          setAlert({ show: true, type: 'error', message: `Please fill out all fields for Ornament #${index + 1}.` });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const submissionData = new FormData();
    submissionData.append("loanDetails", JSON.stringify(loanDetails));

    const ornamentsForApi = ornamentRows.map((row) => {
      const finalOrnament = masterOrnamentList.find(
        (o) =>
          o.ornament_type === row.ornament_type &&
          o.ornament_name === row.ornament_name &&
          o.material_type === row.material_type
      );
      return {
        ornament_id: finalOrnament ? finalOrnament.ornament_id : null,
        ornament_type: row.ornament_type,
        ornament_name: row.ornament_name,
        grams: row.grams,
        karat: row.karat,
      };
    });

    submissionData.append("ornaments", JSON.stringify(ornamentsForApi));

    ornamentRows.forEach((ornament, index) => {
      if (ornament.ornament_image) {
        submissionData.append(
          `ornament_image_${index}`,
          ornament.ornament_image
        );
      }
    });

    try {
      await axios.post(`${API_BASE_URL}/api/loans`, submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAlert({
        show: true,
        type: "success",
        message: "Loan application created successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Failed to create loan application.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputHeight = "h-13";
  const inputStyle = `w-full p-2 rounded bg-[#1f2628] ${inputHeight} text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]`;
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";
  const fileInputStyle = `${inputStyle} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c69909] file:text-black hover:file:bg-yellow-500 cursor-pointer`;
  const actionButtonStyle = "flex items-center justify-center bg-[#c69909] text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors text-base";
  const clearButtonStyle = "flex items-center text-gray-400 font-semibold hover:text-red-400 text-xs transition-colors";
  return (
    <>
      {alert?.show && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-6">
          New Loan Application
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-white">Loan Information</h3>
              <button
                type="button"
                onClick={clearLoanDetails}
                className={clearButtonStyle}
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Clear Section
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>Customer*</label>
                <select
                  name="customer_id"
                  value={loanDetails.customer_id}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  required
                >
                  <option value="">Select a Customer</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Interest Rate (%)*</label>
                <input
                  type="number"
                  name="interest_rate"
                  value={loanDetails.interest_rate}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  placeholder="e.g., 12.5"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Due Date*</label>
                <input
                  type="date"
                  name="due_date"
                  value={loanDetails.due_date}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Loan Date & Time*</label>
                <input
                  type="datetime-local"
                  name="loan_datetime"
                  value={loanDetails.loan_datetime}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Eligible Amount (₹)*</label>
                <input
                  type="number"
                  name="eligible_amount"
                  value={loanDetails.eligible_amount}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Amount Issued (₹)*</label>
                <input
                  type="number"
                  name="amount_issued"
                  value={loanDetails.amount_issued}
                  onChange={handleLoanChange}
                  className={inputStyle}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </section>
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-white">
                Ornaments Pledged
              </h3>
              <button
                type="button"
                onClick={addOrnamentRow}
                className={actionButtonStyle}
                >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Ornaments
              </button>
            </div>
            <div className="space-y-6">
              {ornamentRows.map((ornament, index) => {
                let filteredList = masterOrnamentList;
                if (ornament.ornament_type)
                  filteredList = filteredList.filter(
                    (o) => o.ornament_type === ornament.ornament_type
                  );
                if (ornament.ornament_name)
                  filteredList = filteredList.filter(
                    (o) => o.ornament_name === ornament.ornament_name
                  );
                if (ornament.material_type)
                  filteredList = filteredList.filter(
                    (o) => o.material_type === ornament.material_type
                  );
                const typeOptions = [
                  ...new Set(filteredList.map((o) => o.ornament_type)),
                ];
                const nameOptions = [
                  ...new Set(filteredList.map((o) => o.ornament_name)),
                ];
                const materialOptions = [
                  ...new Set(filteredList.map((o) => o.material_type)),
                ];

                return (
                  <div key={ornament.key} className="p-4 border border-gray-700 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => clearOrnamentRow(index)}
                      className={`${clearButtonStyle} absolute top-3 right-3 z-10`}
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Clear selection
                    </button>
                    <div className="grid grid-cols-1 mb-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelStyle}>Ornament Type*</label>
                        <select
                          name="ornament_type"
                          value={ornament.ornament_type}
                          onChange={(e) => handleOrnamentChange(index, e)}
                          className={inputStyle}
                          required
                        >
                          <option value="">Select Type</option>
                          {typeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Ornament Name*</label>
                        <select
                          name="ornament_name"
                          value={ornament.ornament_name}
                          onChange={(e) => handleOrnamentChange(index, e)}
                          className={inputStyle}
                          required
                        >
                          <option value="">Select Name</option>
                          {nameOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Material*</label>
                        <select
                          name="material_type"
                          value={ornament.material_type}
                          onChange={(e) => handleOrnamentChange(index, e)}
                          className={inputStyle}
                          required
                        >
                          <option value="">Select Material</option>
                          {materialOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Grams*</label>
                        <input
                          type="number"
                          name="grams"
                          value={ornament.grams}
                          onChange={(e) => handleOrnamentChange(index, e)}
                          className={inputStyle}
                          placeholder="0.00"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Karat*</label>
                        <select
                          name="karat"
                          value={ornament.karat}
                          onChange={(e) => handleOrnamentChange(index, e)}
                          className={inputStyle}
                          required
                        >
                          <option value="">Select Karat</option>
                          {karatTypes.map((k) => (
                            <option key={k.karat_id} value={k.karat_name}>
                              {k.karat_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Ornament Image</label>
                        <input
                          type="file"
                          name="ornament_image"
                          onChange={(e) => handleOrnamentFileChange(index, e)}
                          className={fileInputStyle}
                          accept="image/*"
                        />
                      </div>
                    </div>
                    {ornamentRows.length > 1 && (
                        <button type="button" onClick={() => removeOrnamentRow(index)} className="p-2 bg-red-600/50 text-red-300 rounded-full hover:bg-red-600 hover:text-white">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className={actionButtonStyle}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Loan Application"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
