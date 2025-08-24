// src/components/BillPrintModal.tsx
import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import jsPDF from "jspdf";
import { toPng } from 'html-to-image';
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";

interface Ornament {
  ornament_name: string;
  material_type: string;
  grams: string;
  karat: string;
  image_preview: string | null;
}
interface Slab {
  start_day: number;
  end_day: number;
  interest_rate: string;
}
interface FullSchemeDetails {
    scheme_id: number;
    scheme_name: string;
    description: string;
    slabs: Slab[];
}
interface LoanDataForBill {
  loan_id: string;
  customer_name: string;
  customer_image: { type: string; data: number[] };
  phone: string;
  address: string;
  current_address: string;
  nominee_name: string;
  nominee_phone: string;
  loan_datetime: string;
  due_date: string;
  net_amount_issued: string;
  interest_rate: string;
  processing_fee: string;
  scheme: FullSchemeDetails
  ornaments: Ornament[];
}

interface BillPageProps {
  loanData: LoanDataForBill;
  copyType: "Customer" | "Office";
  logo: string;
}

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: LoanDataForBill;
  logo: string;
  setAlert: (alert: any) => void;
}

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

const DetailRow: React.FC<{ label: string; tamilLabel: string; value: any }> = ({ label, tamilLabel, value }) => (
  <div className="py-1">
    <p className="text-xs text-gray-600 font-semibold">{label} / {tamilLabel}</p>
    <p className="text-sm font-medium text-black">{value || '---'}</p>
  </div>
);

const BillPage: React.FC<BillPageProps> = ({ loanData, copyType, logo }) => {
  const customerImageUrl = bufferToBase64(loanData.customer_image);
  const loanDay = new Date(loanData.loan_datetime).getDate();

  return (
    <div className="bg-white text-black p-6 font-sans w-[210mm] min-h-[297mm] flex flex-col shadow-lg">
      <header className="flex items-center justify-between pb-2">
        <img src={logo} alt="Maaya Gold Finance Logo" className="h-16 w-16" />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">Maaya Gold Finance</h1>
          <p className="text-sm text-gray-600">123, Main Bazaar, R.S. Puram, Coimbatore - 641002</p>
          <p className="text-sm text-gray-600">Phone: 9876543210, 9123456789</p>
        </div>
        <div className="h-16 w-16"></div>
      </header>
      
      <hr className="border-t-2 border-black my-2" />
      
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mt-2">Loan Registration Agreement</h2>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-600">{copyType} Copy</p>
          {customerImageUrl && <img src={customerImageUrl} alt="Customer" className="w-20 h-24 object-cover border-2 border-gray-300 rounded mt-1" />}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-x-8">
        <div>
          <DetailRow label="Loan ID" tamilLabel="கடன் எண்" value={loanData.loan_id} />
          <DetailRow label="Loan Date" tamilLabel="கடன் தேதி" value={new Date(loanData.loan_datetime).toLocaleString()} />
          <DetailRow label="Final Due Date" tamilLabel="இறுதி செலுத்த வேண்டிய தேதி" value={new Date(loanData.due_date).toLocaleDateString()} />
          <DetailRow label="Customer Name" tamilLabel="வாடிக்கையாளர் பெயர்" value={loanData.customer_name} />
        </div>
        <div>
          <DetailRow label="Phone" tamilLabel="தொலைபேசி எண்" value={loanData.phone} />
          <DetailRow label="Nominee Name" tamilLabel="பரிந்துரைக்கப்பட்டவர் பெயர்" value={loanData.nominee_name} />
          <DetailRow label="Nominee Phone" tamilLabel="பரிந்துரைக்கப்பட்டவர் தொலைபேசி" value={loanData.nominee_phone} />
          <DetailRow label="Address" tamilLabel="முகவரி" value={loanData.current_address || loanData.address} />
        </div>
      </section>
      {loanData.scheme && (
        <section className="my-4">
            <h3 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2">
              Scheme Details / திட்ட விவரங்கள்: {loanData.scheme.scheme_name}
            </h3>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-200 uppercase">
                    <tr>
                        <th className="p-2">Days Range</th>
                        <th className="p-2">Interest Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {loanData.scheme.slabs.map((slab: Slab, index: number) => (
                    <tr key={index}>
                        <td className="p-2 font-medium">Day {slab.start_day} to Day {slab.end_day}</td>
                        <td className="p-2">{parseFloat(slab.interest_rate).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
            </table>
        </section>
      )}
      <section className="my-4">
        <h3 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2">Pledged Ornaments / அடகு வைக்கப்பட்ட ஆபரணங்கள்</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-200 uppercase">
            <tr>
              <th className="p-2">Ornament Name</th>
              <th className="p-2">Material</th>
              <th className="p-2">Weight (grams)</th>
              <th className="p-2">Karat</th>
              <th className="p-2">Image</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loanData.ornaments.map((orn: Ornament, index: number) => (
              <tr key={index}>
                <td className="p-2 font-medium">{orn.ornament_name}</td>
                <td className="p-2">{orn.material_type}</td>
                <td className="p-2">{parseFloat(orn.grams).toFixed(2)}g</td>
                <td className="p-2">{orn.karat}</td>
                <td className="p-2">
                  {orn.image_preview && <img src={orn.image_preview} alt="Ornament" className="h-10 w-10 object-cover rounded" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="my-4 grid grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg">
        <DetailRow label="Total Loan Amount Issued" tamilLabel="மொத்த கடன் தொகை" value={formatCurrency(loanData.net_amount_issued)} />
        <DetailRow label="Interest Rate" tamilLabel="வட்டி விகிதம்" value={`${loanData.interest_rate}% per annum`} />
        <DetailRow label="Processing Fee" tamilLabel="செயலாக்க கட்டணம்" value={formatCurrency(loanData.processing_fee)} />
        <div className="py-1">
          <p className="text-xs text-gray-600 font-semibold">Other Expenses / இதர செலவுகள்</p>
          <div className="h-8 border-b border-gray-400"></div>
        </div>
      </section>

      <div className="flex-grow flex flex-col justify-between">
        <section className="text-xs text-gray-600">
          <h3 className="text-base font-bold text-black mb-2">Terms & Conditions / விதிமுறைகளும் நிபந்தனைகளும்</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>This loan is granted against the pledge of the gold ornaments listed above.</li>
            <li>Interest will be calculated monthly.</li>
            <li>Payment is due on or before the {loanDay}{loanDay === 1 ? 'st' : loanDay === 2 ? 'nd' : loanDay === 3 ? 'rd' : 'th'} of every month.</li>
            <li>Failure to repay may result in the auction of the pledged ornaments.</li>
            <li>This document serves as the official agreement.</li>
          </ol>
        </section>

        <footer className="mt-16 flex justify-between items-end border-t border-gray-400 pt-4">
            <div className="text-center"><p className="font-semibold">_________________________</p><p className="text-sm">Customer Signature / வாடிக்கையாளர் கையொப்பம்</p></div>
            <div className="text-center"><p className="font-semibold">_________________________</p><p className="text-sm">Authorized Signatory / அங்கீகரிக்கப்பட்ட கையொப்பமிட்டவர்</p></div>
        </footer>
      </div>
    </div>
  );
};

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen, onClose, loanData, logo, setAlert
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'customer' | 'office'>('customer');
  const handleSavePdf = async () => {
    setIsSaving(true);
    const elementId = view === 'customer' ? 'customer-copy-content' : 'office-copy-content';
    const contentToPrint = document.getElementById(elementId);
    if (!contentToPrint) {
      console.error("Content to print not found!");
      setIsSaving(false);
      return;
    }
    try {
      const imgData = await toPng(contentToPrint, { 
        quality: 1.0,
        pixelRatio: 2,
      });
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBytes = pdf.output('arraybuffer');
      
      const filePath = await save({
        title: `Save ${view === 'customer' ? 'Customer' : 'Office'} Copy`,
        defaultPath: `Loan_${loanData.loan_id}_${view === 'customer' ? 'Customer' : 'Office'}_Copy.pdf`,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });

      if (filePath) {
        await writeBinaryFile({ path: filePath, contents: new Uint8Array(pdfBytes) });
        if (view === 'customer') {
          setView('office');
        } else {
          setAlert({ show: true, type: "success", message: `Loan #${loanData.loan_id} created and saved successfully!` });
          onClose();
        }
      } else {
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Failed to generate or save PDF", error);
      setAlert({
          show: true,
          type: "error",
          message: "Failed to generate or save PDF",
        });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
        setView('customer');
        onClose();
      }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#111315] p-4 text-left align-middle shadow-xl transition-all">
                <div className="bg-gray-400 p-4">
                  <div className="flex justify-center">
                    {view === 'customer' && (
                      <div id="customer-copy-content">
                        <BillPage loanData={loanData} copyType="Customer" logo={logo} />
                      </div>
                    )}
                    {view === 'office' && (
                      <div id="office-copy-content">
                        <BillPage loanData={loanData} copyType="Office" logo={logo} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-center items-center gap-4">
                  <p className="text-sm text-gray-400">
                    Showing: <span className="font-bold text-white">{view === 'customer' ? 'Customer Copy (1 of 2)' : 'Office Copy (2 of 2)'}</span>
                  </p>
                  <button
                    type="button"
                    className="px-8 py-3 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-bold"
                    onClick={handleSavePdf}
                    disabled={isSaving}
                  >
                    {isSaving 
                      ? 'Saving PDF...' 
                      : view === 'customer' 
                        ? 'Save Customer Copy & Continue' 
                        : 'Save Office Copy & Finish'
                    }
                  </button>
                </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
