import React, { useMemo, useRef, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";

interface Ornament {
  ornament_name: string;
  material_type: string;
  karat: string;
  quantity: string;
  gross_weight: string;
  stone_weight: string;
  net_weight: string;
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
  scheme: FullSchemeDetails;
  ornaments: Ornament[];
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

const DetailRow: React.FC<{
  label: string;
  tamilLabel: string;
  value: any;
  isFullWidth?: boolean;
}> = ({ label, tamilLabel, value, isFullWidth }) => (
  <div className={`py-1 ${isFullWidth ? "col-span-2" : ""}`}>
    <p className="text-xs text-gray-600 font-bold">
      {label} / {tamilLabel}
    </p>
    <p className="text-sm font-medium text-black">{value || "---"}</p>
  </div>
);

interface BillPageContentProps {
  loanData: LoanDataForBill;
  logo: string;
  copyType: "Customer" | "Office";
  ornamentsToShow: Ornament[];
  showTotals: boolean;
  showFinancialSummary: boolean;
  showOtherExpenses: boolean;
  showAuctionCharges: boolean;
  showFooter: boolean;
  pageNumber?: number;
  totalPages?: number;
}

const BillPageContent: React.FC<BillPageContentProps> = ({
  loanData,
  logo,
  copyType,
  ornamentsToShow,
  showTotals,
  showFinancialSummary,
  showOtherExpenses,
  showAuctionCharges,
  showFooter,
  pageNumber,
  totalPages,
}) => {
  const customerImageUrl = bufferToBase64(loanData.customer_image);
  const totalGrossWeight = useMemo(
    () =>
      loanData.ornaments.reduce(
        (sum, orn) => sum + (parseFloat(orn.gross_weight) || 0),
        0
      ),
    [loanData.ornaments]
  );
  const totalStoneWeight = useMemo(
    () =>
      loanData.ornaments.reduce(
        (sum, orn) => sum + (parseFloat(orn.stone_weight) || 0),
        0
      ),
    [loanData.ornaments]
  );
  const totalNetWeight = useMemo(
    () =>
      loanData.ornaments.reduce(
        (sum, orn) => sum + (parseFloat(orn.net_weight) || 0),
        0
      ),
    [loanData.ornaments]
  );
  const schemeDetailsString = loanData.scheme
    ? `${loanData.scheme.scheme_name}: ${loanData.scheme.slabs
        .map((s) => `${s.start_day}-${s.end_day} days @ ${s.interest_rate}%`)
        .join(", ")}`
    : "No Scheme Assigned";

  return (
    <div className="bg-white text-black p-4 font-sans w-[210mm] min-h-[297mm] flex flex-col shadow-lg text-left">
      {pageNumber === 1 && (
        <>
          <header className="flex justify-between items-start pb-2">
            <img src={logo} alt="Company Logo" className="h-16 w-16" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">
                Maya Gold Finance
              </h1>
              <p className="text-xs text-gray-600">
                AS Complex, Usilai, Viruveedu - 624220
              </p>
              <p className="text-xs text-gray-600">Phone: 04543295703</p>
            </div>
            {customerImageUrl ? (
              <img
                src={customerImageUrl}
                alt="Customer"
                className="w-20 h-24 object-cover border-2 border-gray-400 rounded"
              />
            ) : (
              <div className="w-20 h-24"></div>
            )}
          </header>
          <div className="text-center text-xs font-bold my-1">
            {copyType} Copy
          </div>
          <hr className="border-t-2 border-black" />
          <h2 className="text-sm font-semibold text-gray-800 mt-1 text-center">
            Loan Registration Agreement
          </h2>
          <section className="mt-3 text-sm">
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow
                label="Loan ID"
                tamilLabel="கடன் எண்"
                value={loanData.loan_id}
              />
              <DetailRow
                label="Phone"
                tamilLabel="தொலைபேசி எண்"
                value={loanData.phone}
              />
              <DetailRow
                label="Loan Date"
                tamilLabel="கடன் தேதி"
                value={new Date(loanData.loan_datetime).toLocaleString()}
              />
              <DetailRow
                label="Nominee Name"
                tamilLabel="பரிந்துரைக்கப்பட்டவர் பெயர்"
                value={loanData.nominee_name}
              />
              <DetailRow
                label="Final Due Date"
                tamilLabel="இறுதி செலுத்த வேண்டிய தேதி"
                value={new Date(loanData.due_date).toLocaleDateString()}
              />
              <DetailRow
                label="Nominee Phone"
                tamilLabel="பரிந்துரைக்கப்பட்டவர் தொலைபேசி"
                value={loanData.nominee_phone}
              />
              <DetailRow
                label="Customer Name"
                tamilLabel="வாடிக்கையாளர் பெயர்"
                value={loanData.customer_name}
              />
              <DetailRow
                label="Address"
                tamilLabel="முகவரி"
                value={loanData.current_address || loanData.address}
              />
            </div>
            <div className="mt-1 border-t-2 border-black pt-1">
              <DetailRow
                label="Scheme Details"
                tamilLabel="திட்ட விவரங்கள்"
                value={schemeDetailsString}
                isFullWidth={true}
              />
            </div>
          </section>
        </>
      )}
      {pageNumber && pageNumber > 1 && (
        <div className="flex justify-between items-center text-sm font-bold border-b-2 border-black pb-1 mb-2">
          <span>Loan ID: {loanData.loan_id} (Continued)</span>
          <span>
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      )}
      <section className="my-3">
        <h3 className="text-sm font-bold border-b-2 border-black pb-1 mb-1">
          Pledged Ornaments / அடகு வைக்கப்பட்ட ஆபரணங்கள்
        </h3>
        <table
          className="w-full text-xs border-collapse"
          style={{ border: "2px solid black" }}
        >
          <thead style={{ borderBottom: "2px solid black" }}>
            <tr className="font-bold text-left">
              <th className="p-1 border-r-2 border-black">Name</th>
              <th className="p-1 border-r-2 border-black">Qty</th>
              <th className="p-1 border-r-2 border-black">Gross Wt.</th>
              <th className="p-1 border-r-2 border-black">Stone Wt.</th>
              <th className="p-1 border-r-2 border-black">Net Wt.</th>
              <th className="p-1 border-r-2 border-black">Karat</th>
              <th className="p-1">Image</th>
            </tr>
          </thead>
          <tbody>
            {ornamentsToShow.map((orn, index) => (
              <tr key={index} style={{ borderBottom: "2px solid black" }}>
                <td className="p-1 border-r-2 border-black">
                  {orn.ornament_name}
                </td>
                <td className="p-1 border-r-2 border-black">{orn.quantity}</td>
                <td className="p-1 border-r-2 border-black">
                  {parseFloat(orn.gross_weight).toFixed(2)}g
                </td>
                <td className="p-1 border-r-2 border-black">
                  {parseFloat(orn.stone_weight).toFixed(2)}g
                </td>
                <td className="p-1 border-r-2 border-black font-bold">
                  {parseFloat(orn.net_weight).toFixed(2)}g
                </td>
                <td className="p-1 border-r-2 border-black">{orn.karat}</td>
                <td className="p-1 flex justify-center items-center">
                  {orn.image_preview && (
                    <div className="h-[40px] w-[40px] border border-gray-400 flex items-center justify-center">
                      <img
                        src={orn.image_preview}
                        alt="Ornament"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {showTotals && (
              <tr className="font-bold bg-gray-100">
                <td
                  colSpan={2}
                  className="p-1 text-right border-r-2 border-black"
                >
                  TOTALS:
                </td>
                <td className="p-1 border-r-2 border-black">
                  {totalGrossWeight.toFixed(2)}g
                </td>
                <td className="p-1 border-r-2 border-black">
                  {totalStoneWeight.toFixed(2)}g
                </td>
                <td className="p-1 border-r-2 border-black">
                  {totalNetWeight.toFixed(2)}g
                </td>
                <td colSpan={2} className="p-1"></td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {showFinancialSummary && (
        <section className="my-3 p-2 border-2 border-black text-sm">
          <div className="grid grid-cols-3 gap-4">
            <DetailRow
              label="Loan Amount Issued"
              tamilLabel="வழங்கப்பட்ட கடன் தொகை"
              value={formatCurrency(loanData.net_amount_issued)}
            />
            <DetailRow
              label="Interest Rate"
              tamilLabel="வட்டி விகிதம்"
              value={`${loanData.interest_rate}% p.a.`}
            />
            <DetailRow
              label="Processing Fee"
              tamilLabel="செயலாக்க கட்டணம்"
              value={formatCurrency(loanData.processing_fee)}
            />
          </div>
        </section>
      )}
      {showOtherExpenses && (
        <section className="mt-4 text-sm">
          <p className="text-xs text-gray-800 font-bold">
            Other Expenses / இதர செலவுகள்:
          </p>
          <div className="h-20"></div>
        </section>
      )}
      {showAuctionCharges && (
        <section className="mt-4 text-sm">
          <p className="text-xs text-gray-800 font-bold">
            Auction Charges / ஏலக் கட்டணங்கள்:
          </p>
          <div className="h-20"></div>
        </section>
      )}
      {showFooter && (
        <div className="flex-grow flex flex-col justify-end mt-auto">
          <footer className="mt-8 flex justify-between items-end border-t-2 border-black pt-2 text-xs">
            <div className="text-center w-1/3">
              <p className="font-semibold">_________________________</p>
              <p className="font-bold">
                Customer Signature / வாடிக்கையாளர் கையொப்பம்
              </p>
            </div>
            <div className="text-center w-1/3">
              <p className="font-semibold">_________________________</p>
              <p className="font-bold">
                Customer Signature (during return of ornaments) / ஆபரணங்கள்
                திரும்பப் பெறும்போது கையொப்பம்
              </p>
            </div>
            <div className="text-center w-1/3">
              <p className="font-semibold">_________________________</p>
              <p className="font-bold">
                Branch Manager Signature / கிளை மேலாளர் கையொப்பம்
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  loanData,
  logo,
  setAlert,
}) => {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const ornamentCount = loanData.ornaments.length;
  const ornamentsPage1 =
    ornamentCount > 9 ? loanData.ornaments.slice(0, 9) : loanData.ornaments;
  const ornamentsPage2 = ornamentCount > 9 ? loanData.ornaments.slice(9) : [];
  const showTotalsOnPage1 = ornamentCount <= 7;
  const showFinancialSummaryOnPage1 = ornamentCount <= 7;
  const showOtherExpensesOnPage1 = ornamentCount <= 6;
  const showAuctionChargesOnPage1 = ornamentCount <= 4;
  const showFooterOnPage1 = ornamentCount <= 4;

  const needsPage2 = !showFooterOnPage1;
  useEffect(() => {
    if (isOpen) {
      const handleSavePdf = async () => {
        try {
          for (const copyType of ["Customer", "Office"] as const) {
            const pdf = new jsPDF("p", "mm", "a4", true);
            const page1Content = page1Ref.current;
            if (!page1Content) throw new Error("Page 1 content not found");
            const imgData1 = await toPng(page1Content, {
              quality: 1.0,
              pixelRatio: 2.5,
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps1 = pdf.getImageProperties(imgData1);
            const pdfHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
            pdf.addImage(
              imgData1,
              "PNG",
              0,
              0,
              pdfWidth,
              pdfHeight1,
              undefined,
              "FAST"
            );
            if (needsPage2) {
              const page2Content = page2Ref.current;
              if (!page2Content) throw new Error("Page 2 content not found");
              pdf.addPage();
              const imgData2 = await toPng(page2Content, {
                quality: 1.0,
                pixelRatio: 2.5,
              });
              const imgProps2 = pdf.getImageProperties(imgData2);
              const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
              pdf.addImage(
                imgData2,
                "PNG",
                0,
                0,
                pdfWidth,
                pdfHeight2,
                undefined,
                "FAST"
              );
            }
            const pdfBytes = pdf.output("arraybuffer");
            const filePath = await save({
              title: `Save ${copyType} Copy`,
              defaultPath: `Loan_${loanData.loan_id}_${copyType}_Copy.pdf`,
              filters: [{ name: "PDF Document", extensions: ["pdf"] }],
            });
            if (!filePath) {
              return;
            }
            await writeBinaryFile({
              path: filePath,
              contents: new Uint8Array(pdfBytes),
            });
          }

          setAlert({
            show: true,
            type: "success",
            message: `Loan #${loanData.loan_id} created and saved successfully!`,
          });
          onClose();
        } catch (error) {
          console.error("Failed to generate PDF:", error);
          setAlert({
            show: true,
            type: "error",
            message: "Failed to generate PDF.",
          });
        } finally {
          onClose();
        }
      };
      const timer = setTimeout(handleSavePdf, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}>
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#111315] p-6 text-center align-middle shadow-xl transition-all">
                <div className="absolute -left-[9999px] top-0">
                  <div ref={page1Ref}>
                    <BillPageContent
                      loanData={loanData}
                      logo={logo}
                      copyType="Customer"
                      ornamentsToShow={ornamentsPage1}
                      showTotals={showTotalsOnPage1}
                      showFinancialSummary={showFinancialSummaryOnPage1}
                      showOtherExpenses={showOtherExpensesOnPage1}
                      showAuctionCharges={showAuctionChargesOnPage1}
                      showFooter={showFooterOnPage1}
                      pageNumber={1}
                      totalPages={needsPage2 ? 2 : 1}
                    />
                  </div>
                  {needsPage2 && (
                    <div ref={page2Ref}>
                      <BillPageContent
                        loanData={loanData}
                        logo={logo}
                        copyType="Customer"
                        ornamentsToShow={ornamentsPage2}
                        showTotals={!showTotalsOnPage1}
                        showFinancialSummary={!showFinancialSummaryOnPage1}
                        showOtherExpenses={!showOtherExpensesOnPage1}
                        showAuctionCharges={!showAuctionChargesOnPage1}
                        showFooter={true}
                        pageNumber={2}
                        totalPages={2}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col items-center justify-center gap-4 min-h-[100px]">
                  <div className="text-white font-semibold text-center">
                    <svg
                      className="animate-spin h-8 w-8 text-white mx-auto mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p>Generating PDF...</p>
                    <p className="text-sm text-gray-400">
                      Please wait, the save dialog will appear shortly.
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
