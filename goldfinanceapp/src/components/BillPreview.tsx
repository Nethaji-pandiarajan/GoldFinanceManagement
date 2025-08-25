//billpreview
import React from 'react';
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri';

interface LoanData {
  loan_id: string;
  customer_name: string;
  customer_image: { type: string; data: number[] };
  phone: string;
  address: string;
  current_address: string;
  nominee_name: string;
  loan_datetime: string;
  due_date: string;
  net_amount_issued: string;
  interest_rate: string;
  processing_fee: string;
  ornaments: {
    ornament_name: string;
    material_type: string;
    grams: string;
    karat: string;
  }[];
}

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

const DetailRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
    <p className="text-sm font-medium text-black">{value || '---'}</p>
  </div>
);

const BillPage = ({ loanData, copyType }: { loanData: LoanData, copyType: 'Customer' | 'Office' }) => {
  const customerImageUrl = bufferToBase64(loanData.customer_image);
  return (
    <div className="bg-white text-black p-8 font-sans w-[210mm] h-[297mm] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold text-black">Maya Gold Finance</h1>
          <h2 className="text-xl font-semibold text-gray-700">Loan Registration Agreement</h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-600">{copyType} Copy</p>
          {customerImageUrl && (
            <img src={customerImageUrl} alt="Customer" className="w-24 h-32 object-cover border-2 border-gray-300 rounded mt-2" />
          )}
        </div>
      </header>
      
      {/* Details */}
      <section className="my-6 grid grid-cols-3 gap-x-8 gap-y-4">
        <DetailRow label="Loan ID" value={loanData.loan_id} />
        <DetailRow label="Loan Date" value={new Date(loanData.loan_datetime).toLocaleString()} />
        <DetailRow label="Final Due Date" value={new Date(loanData.due_date).toLocaleDateString()} />
        <DetailRow label="Customer Name" value={loanData.customer_name} />
        <DetailRow label="Phone" value={loanData.phone} />
        <DetailRow label="Nominee" value={loanData.nominee_name} />
        <div className="col-span-3">
          <DetailRow label="Address" value={loanData.current_address || loanData.address} />
        </div>
      </section>

      {/* Ornaments Table */}
      <section className="my-6">
        <h3 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2">Pledged Ornaments</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-200 uppercase">
            <tr>
              <th className="p-2">Ornament Name</th>
              <th className="p-2">Material</th>
              <th className="p-2">Weight (grams)</th>
              <th className="p-2">Karat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loanData.ornaments.map((orn, index) => (
              <tr key={index}>
                <td className="p-2 font-medium">{orn.ornament_name}</td>
                <td className="p-2">{orn.material_type}</td>
                <td className="p-2">{parseFloat(orn.grams).toFixed(2)}g</td>
                <td className="p-2">{orn.karat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Financial Summary */}
      <section className="my-6 grid grid-cols-3 gap-8 p-4 bg-gray-100 rounded-lg">
        <DetailRow label="Net Amount Issued" value={formatCurrency(loanData.net_amount_issued)} />
        <DetailRow label="Interest Rate" value={`${loanData.interest_rate}% per annum`} />
        <DetailRow label="Processing Fee" value={formatCurrency(loanData.processing_fee)} />
      </section>

      {/* Terms and Signatures take up remaining space */}
      <div className="flex-grow flex flex-col justify-between">
        <section className="text-xs text-gray-600">
          <h3 className="text-base font-bold text-black mb-2">Terms & Conditions</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>This loan is granted against the pledge of the gold ornaments listed above.</li>
            <li>Interest will be calculated monthly. Full payment must be completed by the due date.</li>
            <li>Failure to repay may result in the auction of the pledged ornaments.</li>
            <li>This document serves as the official agreement.</li>
          </ol>
        </section>

        <footer className="mt-16 flex justify-between items-end border-t border-gray-400 pt-4">
            <div className="text-center"><p className="font-semibold">_________________________</p><p className="text-sm">Customer Signature</p></div>
            <div className="text-center"><p className="font-semibold">_________________________</p><p className="text-sm">Authorized Signatory</p></div>
        </footer>
      </div>
    </div>
  );
};


export const BillPreview: React.FC<{ loanData: LoanData }> = ({ loanData }) => {

  const handleSavePdf = async () => {
    const billElement = document.getElementById('bill-content');
    if (!billElement) {
      console.error('Bill content element not found!');
      return;
    }
    const htmlContent = billElement.outerHTML;

    try {
        const filePath = await save({
            title: 'Save Loan Agreement',
            defaultPath: `Loan_${loanData.loan_id}_Agreement.pdf`,
            filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
        });

        if (filePath) {
            const pdfBytes: number[] = await invoke('generate_pdf_from_html', { html: htmlContent });
            await writeBinaryFile({ path: filePath, contents: new Uint8Array(pdfBytes) }); 
            
            window.close();
        }
    } catch (error) {
        console.error("Failed to generate PDF", error);
        alert(`Failed to save PDF: ${error}`);
    }
  };

  return (
    <div className="bg-gray-300">
      <div className="no-print bg-gray-800 p-4 text-center sticky top-0 shadow-lg z-10">
        <button 
          onClick={handleSavePdf}
          className="px-6 py-2 bg-[#c69909] text-black font-bold rounded hover:bg-yellow-500"
        >
          Save PDF
        </button>
      </div>
      
      <div id="bill-content" className="mx-auto my-4">
        <style>{`
          @media print {
            .no-print { display: none; }
            .page-break { page-break-after: always; }
          }
        `}</style>

        <div className="page-break">
          <BillPage loanData={loanData} copyType="Customer" />
        </div>

        <div>
          <BillPage loanData={loanData} copyType="Office" />
        </div>
      </div>
    </div>
  );
};