import { useState, useEffect, useMemo } from "react";
import api from "../api";
import { v4 as uuidv4 } from "uuid";
import {
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  EyeIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import SearchableDropdown from "./SearchableDropdown";
import LoanCalculatorWidget from "./LoanCalculatorWidget";
import LoanConfirmationModal from "./LoanConfirmationModal";
import ImageViewerModal from "./ImageViewerModal";
import CustomDateTimePicker from "./DateTimePicker";
import ImageUploadModal from "./ImageUploadModal";
import CustomDatePicker from "./DatePicker";
import clsx from "clsx";
import OtpVerificationModal from "./OtpVerificationModal";
import { BillPrintModal } from './BillPrintModal';
import companyLogo from '../assets/blackmgflogo.png';
import TotalOrnamentValue from './TotalOrnamentValue';
const bufferToBase64 = (
  buffer: { type: string; data: number[] } | null | undefined
): string | null => {
  if (!buffer || buffer.type !== "Buffer" || !buffer.data) return null;
  const binary = new Uint8Array(buffer.data).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ""
  );
  return `data:image/jpeg;base64,${btoa(binary)}`;
};
const formatCurrency = (value: string | number) => {
  const num = parseFloat(String(value));
  if (isNaN(num)) return "₹ 0.00";
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface LoanDetails {
  loan_id: string;
  processing_fee: string;
  customer_id: string;
  nominee_id: string;
  interest_rate: string;
  due_date: string;
  loan_datetime: string;
  eligible_amount: string;
  amount_issued: string;
  loan_application_uuid: string;
  scheme_id: string;
  loan_to_value: string;
}
interface Scheme {
  scheme_id: number;
  scheme_name: string;
}
interface FullSchemeDetails extends Scheme {
    description: string;
    slabs: {
        start_day: number;
        end_day: number;
        interest_rate: string;
    }[];
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
  current_address: string;
}
interface CalculationData {
  goldRates: { karat_name: string; today_rate: string; }[];
}

const initialLoanDetails = (id: string): LoanDetails => ({
  loan_id: id,
  loan_application_uuid: uuidv4(),
  customer_id: "",
  nominee_id: "",
  interest_rate: "",
  due_date: "",
  loan_datetime: new Date().toISOString(),
  eligible_amount: "0",
  amount_issued: "0",
  processing_fee: "100",
  scheme_id : "",
  loan_to_value: "75.00"
});
const initialOrnamentRow = (): OrnamentRow => ({
  key: Date.now(),
  ornament_type: "",
  ornament_name: "",
  material_type: "Gold",
  grams: "",
  karat: "",
  ornament_image: null,
  image_preview: null,
});
const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
    <h3 className="text-xl font-semibold text-white">{title}</h3>
  </div>
);
const CalcRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-gray-400">{label}:</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
);

export default function NewLoanApplication() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(
    initialLoanDetails("Loading...")
  );
  const [ornamentRows, setOrnamentRows] = useState<OrnamentRow[]>([
    initialOrnamentRow(),
  ]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDisplayDetails, setCustomerDisplayDetails] =
    useState<CustomerDisplayDetails | null>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [usePermanentAddress, setUsePermanentAddress] = useState(false);
  const [calculationData, setCalculationData] = useState<CalculationData>({
    goldRates: []
  });
  const [masterOrnamentList, setMasterOrnamentList] = useState<any[]>([]);
  const [karatTypes, setKaratTypes] = useState<any[]>([]);
  const [isImageUploadOpen, setImageUploadOpen] = useState(false);
  const [editingOrnamentIndex, setEditingOrnamentIndex] = useState<number | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<FullSchemeDetails | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isOtpModalOpen, setOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [loanDataForPrint, setLoanDataForPrint] = useState<any | null>(null);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [nextIdRes, goldRatesRes, custRes, ornRes , schemesRes] = await Promise.all([
          api.get("/api/loans/next-id"),
          api.get("/api/loans/calculation-data"),
          api.get(`/api/customers-list`),
          api.get(`/api/ornaments/all`),
          api.get('/api/schemes/utils/list'),
        ]);
        setLoanDetails(initialLoanDetails(nextIdRes.data.next_id));
        setCalculationData({ goldRates: goldRatesRes.data.goldRates });
        setCustomers(custRes.data);
        setMasterOrnamentList(ornRes.data);
        setSchemes(schemesRes.data);
        setKaratTypes(goldRatesRes.data.goldRates.map((r: any) => ({ karat_name: r.karat_name })));
      } catch (error) {
        setAlert({
          show: true,
          type: "error",
          message: "Failed to load initial form data.",
        });
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.uuid) {
      const fetchCustomerDetails = async () => {
        try {
          const res = await api.get(`/api/customers/${selectedCustomer.uuid}`);
          const customerData = res.data;
          setCustomerDisplayDetails(customerData);
          setLoanDetails((prev) => ({
            ...prev,
            customer_id: selectedCustomer.id,
            nominee_id: customerData.nominee_id,
          }));
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
          setCustomerDisplayDetails(null);
          setCurrentAddress("");
        }
      };
      fetchCustomerDetails();
    } else {
      setCustomerDisplayDetails(null);
      setCurrentAddress("");
      setUsePermanentAddress(false);
      setLoanDetails((prev) => ({ ...prev, customer_id: "", nominee_id: "" }));
    }
  }, [selectedCustomer]);
  useEffect(() => {
    const fetchFullSchemeDetails = async () => {
        if (loanDetails.scheme_id) {
            try {
                const response = await api.get(`/api/schemes/${loanDetails.scheme_id}`);
                setSelectedScheme(response.data);
            } catch (error) {
                console.error("Failed to fetch full scheme details", error);
                setSelectedScheme(null);
            }
        } else {
            setSelectedScheme(null);
        }
    };
    fetchFullSchemeDetails();
  }, [loanDetails.scheme_id]);
  useEffect(() => {
    if (usePermanentAddress) {
      setCurrentAddress(customerDisplayDetails?.address || "");
    }
  }, [usePermanentAddress, customerDisplayDetails]);
  const handleCurrentAddressChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCurrentAddress(e.target.value);
    setUsePermanentAddress(false);
  };
  const ornamentsWithValue = useMemo(() => {
        return ornamentRows.map(ornament => {
            if (!ornament.grams || !ornament.karat || isNaN(parseFloat(ornament.grams))) {
                return { ornament_name: ornament.ornament_name, value: 0 };
            }
            
            const rateInfo = calculationData.goldRates.find(r => r.karat_name === ornament.karat);
            if (!rateInfo) {
                return { ornament_name: ornament.ornament_name, value: 0 };
            }

            const value = parseFloat(ornament.grams) * parseFloat(rateInfo.today_rate);
            return { ornament_name: ornament.ornament_name, value };
        });
    }, [ornamentRows, calculationData.goldRates]);
  const totalOrnamentValue = useMemo(() => {
        return ornamentsWithValue.reduce((total, orn) => total + orn.value, 0);
    }, [ornamentsWithValue]);
  const calculatedEligibleAmount = useMemo(() => {
    const currentLTV = parseFloat(loanDetails.loan_to_value) || 0;
    return totalOrnamentValue * (currentLTV / 100);
  }, [totalOrnamentValue, loanDetails.loan_to_value]);

  useEffect(() => {
    setLoanDetails((prev) => ({
      ...prev,
      eligible_amount: calculatedEligibleAmount.toFixed(2),
    }));
  }, [calculatedEligibleAmount]);
  const handleLoanDateTimeChange = (date: Date | null) => {
    if (date) {
      setLoanDetails((prev) => ({
        ...prev,
        loan_datetime: date.toISOString(),
      }));
    }
  };
  const handleDueDateChange = (date: Date | null) => {
    if (date) {
      setLoanDetails((prev) => ({
        ...prev,
        due_date: date.toISOString().split("T")[0],
      }));
    }
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLoanDetails({ ...loanDetails, [e.target.name]: e.target.value });
  };
  const handleOrnamentChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const updatedRows = [...ornamentRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [e.target.name]: e.target.value,
    };
    setOrnamentRows(updatedRows);
  };
  const handleOrnamentImageUpload = (file: File) => {
    if (editingOrnamentIndex !== null) {
      const updatedRows = [...ornamentRows];
      if (updatedRows[editingOrnamentIndex].image_preview) {
        URL.revokeObjectURL(updatedRows[editingOrnamentIndex].image_preview!);
      }
      updatedRows[editingOrnamentIndex].ornament_image = file;
      updatedRows[editingOrnamentIndex].image_preview =
        URL.createObjectURL(file);
      setOrnamentRows(updatedRows);
    }
  };
  const addOrnamentRow = () =>
    setOrnamentRows([...ornamentRows, initialOrnamentRow()]);
  const removeOrnamentRow = (index: number) => {
    if (ornamentRows.length > 1) {
      const rowToRemove = ornamentRows[index];
      if (rowToRemove.image_preview) {
        URL.revokeObjectURL(rowToRemove.image_preview);
      }
      setOrnamentRows(ornamentRows.filter((_, i) => i !== index));
    }
  };
  const clearOrnamentRow = (index: number) => {
    const updatedRows = [...ornamentRows];
    if (updatedRows[index].image_preview) {
      URL.revokeObjectURL(updatedRows[index].image_preview!);
    }
    updatedRows[index] = {
      ...initialOrnamentRow(),
      key: updatedRows[index].key,
    };
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
      "customer_id",
      "scheme_id", 
      "interest_rate",
      "loan_datetime",
      "due_date",
      "eligible_amount",
      "amount_issued",
    ];
    for (const field of requiredLoanFields) {
      if (!loanDetails[field]) {
        setAlert({
          show: true,
          type: "error",
          message: `Please fill out the "${field.replace(/_/g, " ")}" field.`,
        });
        return false;
      }
    }
    for (const [index, ornament] of ornamentRows.entries()) {
      if (
        !ornament.material_type ||
        !ornament.ornament_type ||
        !ornament.ornament_name ||
        !ornament.grams ||
        !ornament.karat
      ) {
        setAlert({
          show: true,
          type: "error",
          message: `Please fill out all fields for Ornament #${index + 1}.`,
        });
        return false;
      }
    }
    return true;
  };
  const handleSubmitToApi = async () => {
    setLoading(true);
    setOtpModalOpen(false);

    const finalLoanDetails = {
      ...loanDetails,
      current_address: currentAddress,
    };
    const submissionData = new FormData();
    submissionData.append("loanDetails", JSON.stringify(finalLoanDetails));
    const ornamentsForApi = ornamentRows.map((row) => ({
      ornament_id:
        masterOrnamentList.find((o) => o.ornament_name === row.ornament_name)
          ?.ornament_id || null,
      ornament_type: row.ornament_type,
      ornament_name: row.ornament_name,
      material_type: row.material_type,
      grams: row.grams,
      karat: row.karat,
    }));
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
      const response = await api.post(`/api/loans`, submissionData);
      const newLoanId = response.data.newLoanId;
      const fullLoanDataResponse = await api.get(`/api/loans/${newLoanId}`);
      const loanDataFromApi = fullLoanDataResponse.data;
      const completeLoanDataForPrint = {
        ...loanDataFromApi,
        nominee_phone: customerDisplayDetails?.nominee_mobile,
        scheme: selectedScheme,
        ornaments: ornamentRows.map(orn => ({
          ornament_name: orn.ornament_name,
          material_type: orn.material_type,
          grams: orn.grams,
          karat: orn.karat,
          image_preview: orn.image_preview,
        })),
      };
      setLoanDataForPrint(completeLoanDataForPrint);
      setPrintModalOpen(true);
      // setAlert({ show: true, type: "success", message: `Loan #${newLoanId} created successfully!` });

    } catch (error) {
      setAlert({ show: true, type: "error", message: "Failed to create or print loan application." });
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
    }
  };
  const handleSendOtp = async () => {
    if (!selectedCustomer?.phone || !selectedCustomer?.name) {
      setAlert({
        show: true,
        type: "error",
        message: "Customer phone number or name is missing.",
      });
      return;
    }
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      await api.post("/api/otp/send", {
        phone: selectedCustomer.phone,
        name: selectedCustomer.name,
      });
      setConfirmModalOpen(false);
      setOtpModalOpen(true);
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Failed to send OTP. Please try again.",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };
  const handleVerifyOtpAndSubmit = async (otp: string) => {
    if (!selectedCustomer?.phone) return;

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      await api.post("/api/otp/verify", { phone: selectedCustomer.phone, otp });
      await handleSubmitToApi();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Verification failed.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  const resetFormForNewLoan = async () => {
    try {
      const nextIdRes = await api.get("/api/loans/next-id");
      setLoanDetails(initialLoanDetails(nextIdRes.data.next_id));
      setOrnamentRows([initialOrnamentRow()]);
      setSelectedCustomer(null);
      setCustomerDisplayDetails(null);
      setCurrentAddress("");
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not prepare for new loan. Please refresh.",
      });
    }
  };
  const totalMonths = useMemo(() => {
    if (!loanDetails.loan_datetime || !loanDetails.due_date) {
      return 0;
    }

    const start = new Date(loanDetails.loan_datetime);
    const end = new Date(loanDetails.due_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return 0;
    }

    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();

    let months = yearDiff * 12 + monthDiff;
    if (end.getDate() < start.getDate()) {
      months--;
    }
    const finalMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (finalMonths === 0 && start.getDate() < end.getDate()) {
      return 1;
    }
    let tenure = finalMonths;
    if (end.getDate() > start.getDate()) {
      tenure++;
    }

    return tenure <= 0 ? 1 : tenure;
  }, [loanDetails.loan_datetime, loanDetails.due_date]);

  // const monthlyPrincipal = useMemo(() => {
  //   const netAmount =
  //     parseFloat(loanDetails.amount_issued) -
  //     parseFloat(loanDetails.processing_fee);
  //   return totalMonths > 0 ? Math.max(0, netAmount) / totalMonths : 0;
  // }, [loanDetails.amount_issued, loanDetails.processing_fee, totalMonths]);

  const monthlyInterest = useMemo(() => {
    const netAmount =
      parseFloat(loanDetails.amount_issued) -
      parseFloat(loanDetails.processing_fee);
    const rate = parseFloat(loanDetails.interest_rate);
    return netAmount > 0 && rate > 0 ? (netAmount * (rate / 100)) / 12 : 0;
  }, [
    loanDetails.amount_issued,
    loanDetails.processing_fee,
    loanDetails.interest_rate,
  ]);

  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";
  const inputStyle = `w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909] focus:ring-1 focus:ring-[#c69909]`;

  return (
    <div className="relative">
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      {viewingImage && (
        <ImageViewerModal
          imageUrl={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
      {isImageUploadOpen && (
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={() => setImageUploadOpen(false)}
          onFileUpload={handleOrnamentImageUpload}
        />
      )}
      {loanDataForPrint && (
        <BillPrintModal 
          isOpen={isPrintModalOpen}
          loanData={loanDataForPrint}
          logo={companyLogo}
          setAlert={setAlert}
          onClose={() => {
            setPrintModalOpen(false);
            resetFormForNewLoan();
          }}
        />
      )}
      <LoanCalculatorWidget
        eligibleAmount={parseFloat(loanDetails.eligible_amount)}
        amountIssued={parseFloat(loanDetails.amount_issued)}
        processingFee={parseFloat(loanDetails.processing_fee)}
      />
      <LoanConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSendOtp}
        loanDetails={loanDetails}
        customer={selectedCustomer}
        ornaments={ornamentRows}
        loading={isSendingOtp}
        customerDisplayDetails={customerDisplayDetails}
        selectedScheme={selectedScheme}
      />
      {selectedCustomer && (
        <OtpVerificationModal
          isOpen={isOtpModalOpen}
          onClose={() => setOtpModalOpen(false)}
          onVerify={handleVerifyOtpAndSubmit}
          onResend={handleSendOtp}
          loading={isVerifyingOtp || loading}
          error={otpError}
          customerPhone={selectedCustomer.phone}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-[#c69909] mb-6">
            New Loan Application
          </h1>
            <form onSubmit={handleOpenConfirmModal} className="space-y-8">
              <section>
                <SectionHeader title="Loan Details" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelStyle}>Loan ID</label>
                    <div
                      className={`${inputStyle} bg-black/20 flex items-center text-gray-400 font-semibold`}
                    >
                      {loanDetails.loan_id}
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Loan Date & Time*</label>
                    <div className="custom-picker-wrapper">
                      <CustomDateTimePicker
                        value={
                          loanDetails.loan_datetime
                            ? new Date(loanDetails.loan_datetime)
                            : null
                        }
                        onChange={handleLoanDateTimeChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Due Date*</label>
                    <div className="custom-picker-wrapper">
                      <CustomDatePicker
                        value={
                          loanDetails.due_date
                            ? new Date(loanDetails.due_date)
                            : null
                        }
                        onChange={handleDueDateChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Select Scheme*</label>
                    <select 
                      name="scheme_id"
                      value={loanDetails.scheme_id}
                      onChange={handleLoanChange}
                      className={inputStyle}
                      required 
                    >
                        <option value="">Choose a scheme</option>
                        {schemes.map((scheme) => (
                            <option key={scheme.scheme_id} value={scheme.scheme_id}>
                                {scheme.scheme_name}
                            </option>
                        ))}
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader title="Customer Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className={labelStyle}>
                        Customer Name & Phone*
                      </label>
                      <SearchableDropdown
                        items={customers}
                        selected={selectedCustomer}
                        setSelected={setSelectedCustomer}
                        placeholder="Search customers..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelStyle}>Gender</label>
                        <div
                          className={`${inputStyle} bg-black/20 flex items-center text-gray-400`}
                        >
                          {customerDisplayDetails?.gender || "..."}
                        </div>
                      </div>
                      <div>
                        <label className={labelStyle}>Date of Birth</label>
                        <div
                          className={`${inputStyle} bg-black/20 flex items-center text-gray-400`}
                        >
                          {customerDisplayDetails?.date_of_birth
                            ? new Date(
                                customerDisplayDetails.date_of_birth
                              ).toLocaleDateString()
                            : "..."}
                        </div>
                      </div>
                      <div>
                        <label className={labelStyle}>Nominee</label>
                        <div
                          className={`${inputStyle} bg-black/20 flex items-center text-gray-400 truncate`}
                          title={
                            customerDisplayDetails
                              ? `${customerDisplayDetails.nominee_name} (${customerDisplayDetails.nominee_mobile})`
                              : ""
                          }
                        >
                          {customerDisplayDetails
                            ? `${customerDisplayDetails.nominee_name}`
                            : "..."}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <label className={labelStyle}>Customer Image</label>
                    <div className="w-40 h-48 bg-black/20 rounded-md flex items-center justify-center border border-gray-700">
                      {customerDisplayDetails?.customer_image ? (
                        <img
                          src={
                            bufferToBase64(
                              customerDisplayDetails.customer_image
                            ) ?? undefined
                          }
                          alt="Customer"
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Select Customer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className={labelStyle}>Permanent Address</label>
                    <textarea
                      value={customerDisplayDetails?.address || "..."}
                      className={`${inputStyle} bg-black/20 cursor-not-allowed`}
                      readOnly
                      rows={3}
                    ></textarea>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className={labelStyle}>Current Address</label>
                      <div className="flex items-center mb-2">
                        <input
                          id="sameAsPermanent"
                          type="checkbox"
                          checked={usePermanentAddress}
                          onChange={(e) =>
                            setUsePermanentAddress(e.target.checked)
                          }
                          className="h-4 w-4 rounded bg-[#1f2628] border-gray-600 text-[#c69909] focus:ring-[#c69909]"
                          disabled={!selectedCustomer}
                        />
                        <label
                          htmlFor="sameAsPermanent"
                          className="ml-2 text-sm text-gray-300"
                        >
                          Same as permanent
                        </label>
                      </div>
                    </div>
                    <textarea
                      value={currentAddress}
                      onChange={handleCurrentAddressChange}
                      className={inputStyle}
                      rows={3}
                      placeholder={
                        selectedCustomer
                          ? "Enter current address..."
                          : "Select a customer first"
                      }
                      disabled={!selectedCustomer}
                    ></textarea>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader title="Ornament Details" />
                <div className="space-y-4 mb-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addOrnamentRow}
                      className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" /> Add Ornament
                    </button>
                  </div>
                  {ornamentRows.map((ornament, index) => (
                    <div
                      key={ornament.key}
                      className="p-4 border border-gray-700/50 rounded-lg"
                    >
                      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_0.7fr_0.5fr_0.7fr] gap-x-4 items-center">
                        <button
                          type="button"
                          onClick={() => clearOrnamentRow(index)}
                          className="absolute -top-2 -right-2 p-1 text-gray-400 hover:text-white rounded-full bg-[#111315] hover:bg-red-500/50 z-10"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                        <div>
                          <label className={labelStyle}>Material Type*</label>
                          <select
                            name="material_type"
                            value={ornament.material_type}
                            onChange={(e) => handleOrnamentChange(index, e)}
                            className={inputStyle}
                            required
                          >
                            <option value="Gold">Gold</option>
                            {[
                              ...new Set(
                                masterOrnamentList.map((o) => o.material_type)
                              ),
                            ]
                              .filter((o) => o !== "Gold")
                              .map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelStyle}>Ornament Type*</label>
                          <select
                            name="ornament_type"
                            value={ornament.ornament_type}
                            onChange={(e) => handleOrnamentChange(index, e)}
                            className={inputStyle}
                            required
                          >
                            <option value="">Select</option>
                            {[
                              ...new Set(
                                masterOrnamentList
                                  .filter(
                                    (o) =>
                                      !ornament.material_type ||
                                      o.material_type === ornament.material_type
                                  )
                                  .map((o) => o.ornament_type)
                              ),
                            ].map((opt) => (
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
                            <option value="">Select</option>
                            {[
                              ...new Set(
                                masterOrnamentList
                                  .filter(
                                    (o) =>
                                      (!ornament.material_type ||
                                        o.material_type ===
                                          ornament.material_type) &&
                                      (!ornament.ornament_type ||
                                        o.ornament_type ===
                                          ornament.ornament_type)
                                  )
                                  .map((o) => o.ornament_name)
                              ),
                            ].map((opt) => (
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
                            <option value="">Select</option>
                            {karatTypes.map((k) => (
                              <option key={k.karat_name} value={k.karat_name}>
                                {k.karat_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelStyle}>Ornament Image</label>
                          <div className="flex items-center gap-2 ">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrnamentIndex(index);
                                setImageUploadOpen(true);
                              }}
                              className={clsx(
                                "h-12 w-full rounded text-sm transition-colors flex items-center justify-center gap-2",
                                ornament.image_preview
                                  ? "bg-green-500/20 border-green-500 text-green-300"
                                  : "bg-[#1f2628] hover:border-[#c69909] border border-transparent text-gray-300"
                              )}
                            >
                              {ornament.image_preview ? (
                                <>
                                  <CheckIcon className="h-5 w-5" />
                                  <span>Uploaded</span>
                                </>
                              ) : (
                                <span>Select Image</span>
                              )}
                            </button>
                            {ornament.image_preview && (
                              <button
                                type="button"
                                title="Preview Image"
                                onClick={() =>
                                  setViewingImage(ornament.image_preview)
                                }
                                className="p-2 text-blue-400 hover:text-white rounded-full hover:bg-blue-500/20"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                            )}
                            {ornamentRows.length > 1 && (
                              <button
                                type="button"
                                title="Remove row"
                                onClick={() => removeOrnamentRow(index)}
                                className="p-2 text-red-400 hover:text-white rounded-full hover:bg-red-500/10"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                   <TotalOrnamentValue ornamentsWithValue={ornamentsWithValue} />
                </div>
              </section>
              <section>
                <SectionHeader title="Amount & Fee Details" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                    <label className={labelStyle}>Loan to Value (LTV %)*</label>
                    <input 
                        type="number" 
                        name="loan_to_value" 
                        value={loanDetails.loan_to_value} 
                        onChange={handleLoanChange} 
                        className={inputStyle} 
                        placeholder="e.g., 75.00" 
                        step="0.01" 
                        required 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Eligible Amount (₹)</label>
                    <div
                      className={`${inputStyle} bg-black/20 flex items-center font-bold text-lg text-green-300`}
                    >
                      {formatCurrency(loanDetails.eligible_amount)}
                    </div>
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
                  <div>
                    <label className={labelStyle}>Processing Fee (₹)</label>
                    <input
                      type="number"
                      name="processing_fee"
                      value={loanDetails.processing_fee}
                      onChange={handleLoanChange}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader title="Monthly Calculation Summary" />
                <div className="p-4 bg-black/20 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-x-9 gap-y-2">
                  <CalcRow label="Total Months" value={totalMonths} />
                  {/* <CalcRow
                    label="Principal / Month"
                    value={formatCurrency(monthlyPrincipal)}
                  /> */}
                  <CalcRow
                    label="Interest / Month"
                    value={formatCurrency(monthlyInterest)}
                  />
                </div>
              </section>

              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="flex items-center justify-center bg-[#c69909] text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500"
                  disabled={loading}
                >
                  Review & Submit
                </button>
              </div>
            </form>
      </div>
    </div>
  );
}
