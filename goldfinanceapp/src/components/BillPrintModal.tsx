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
  ornament_image: { type: string; data: number[] };
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
    <p className="text-xs text-black font-bold">
      {label} / {tamilLabel}
    </p>
    <p className="text-sm font-medium text-gray-800">{value || "---"}</p>
  </div>
);

const BillPageContent: React.FC<{
  loanData: LoanDataForBill;
  logo: string;
  copyType: "Customer" | "Office";
}> = ({ loanData, logo, copyType }) => {
  const customerImageUrl = bufferToBase64(loanData.customer_image);
  const ornamentImageUrl = bufferToBase64(loanData.ornament_image);
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

  const ornamentsString = useMemo(
    () =>
      loanData.ornaments
        .map(
          (orn) =>
            `${orn.ornament_name} - ${orn.quantity} - ${parseFloat(
              orn.net_weight
            ).toFixed(2)}g`
        )
        .join(", "),
    [loanData.ornaments]
  );

  const schemeDetailsString = loanData.scheme
    ? `${loanData.scheme.scheme_name}: ${loanData.scheme.slabs
        .map((s) => `${s.start_day}-${s.end_day} days :  ${s.interest_rate}%`)
        .join(", ")}`
    : "No Scheme Assigned";

  return (
    <div className="bg-white text-black p-4 font-sans w-[210mm] min-h-[297mm] flex flex-col shadow-lg text-left">
      <header className="flex justify-between items-start pb-2">
        <img src={logo} alt="Company Logo" className="h-16 w-16" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">Maya Gold Finance</h1>
          <p className="text-xs text-black">
            AS Complex, Usilai, Viruveedu - 624220
          </p>
          <p className="text-xs text-black">Phone: 04543295703</p>
          <p className="text-sm font-bold pt-1">{copyType} Copy</p>
          <p className="text-sm font-semibold text-black">
            Loan Registration Agreement
          </p>
        </div>
        {customerImageUrl ? (
          <img
            src={customerImageUrl}
            alt="Customer"
            className="w-20 h-24 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-24"></div>
        )}
      </header>
      <hr className="border-t-2 border-black my-1" />
      <section className="mt-2 text-sm">
        <div className="grid grid-cols-3 gap-x-6">
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
          <DetailRow
            label="Scheme Details"
            tamilLabel="திட்ட விவரங்கள்"
            value={schemeDetailsString}
          />
        </div>
      </section>
      <hr className="border-t-2 border-black my-1" />
      <section className="my-3">
        <h3 className="text-sm font-bold pb-1 mb-1">
          Pledged Ornaments / அடகு வைக்கப்பட்ட ஆபரணங்கள்
        </h3>
        <div className="p-2 text-xs min-h-[30px]">
          <p>{ornamentsString}</p>
        </div>
      </section>
      <hr className="border-t-2 border-black my-1" />
      <section className="my-3 p-2 text-sm">
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
        <div className="grid grid-cols-3 gap-4 mt-2 pt-2">
          <DetailRow
            label="Total Gross Weight"
            tamilLabel="மொத்த எடை"
            value={`${totalGrossWeight.toFixed(2)}g`}
          />
          <DetailRow
            label="Total Stone Weight"
            tamilLabel="கல் எடை"
            value={`${totalStoneWeight.toFixed(2)}g`}
          />
          <DetailRow
            label="Total Net Weight"
            tamilLabel="நிகர எடை"
            value={`${totalNetWeight.toFixed(2)}g`}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2 pt-2">
          <div>
            <p className="text-xs text-black font-bold">
              Ornament Image / ஆபரணப் படம்
            </p>
            <div className="h-48 mt-1 rounded flex items-center justify-center">
              {ornamentImageUrl ? (
                <img
                  src={ornamentImageUrl}
                  alt="Ornaments"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-sm text-black-500">No Image</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-black font-bold">
              Other Expenses / இதர செலவுகள்:
            </p>
          </div>
          <div>
            <p className="text-xs text-black font-bold">
              Auction Charges / ஏலக் கட்டணங்கள்:
            </p>
          </div>
        </div>
      </section>
      <hr className="border-t-2 border-black my-1" />
      <section className="my-4 text-sm grid grid-cols-3 gap-x-4 items-end">
        <div className="col-span-2">
          <p>
            மேலே கொடுக்கப்பட்ட தங்க நகைக் கடன் திட்டத்தின் படி ரூபாய்{" "}
            {parseFloat(String(loanData.net_amount_issued))} வட்டியுடன் சேர்த்து
            மாயா கோல்ட் ஃபைனான்சியர்ஸ் அல்லது அவர்களின் உத்தரவின்படி கேட்கும்
            போது கொடுத்து விடுவேன் என உறுதியளிக்கிறேன்
          </p>
        </div>
        <div className="col-span-1 text-center">
          <p className="font-semibold">_________________________</p>
          <p className="font-bold text-xs">Customer Signature</p>
        </div>
      </section>
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
  const billRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      const handleSavePdf = async () => {
        try {
          const pdf = new jsPDF("p", "mm", "a4", true);
          const billContent = billRef.current;
          if (!billContent) throw new Error("Bill content not found");

          const customerContent = billContent.querySelector("#customer-copy");
          if (!customerContent)
            throw new Error("Customer copy content not found");

          const imgDataCustomer = await toPng(customerContent as HTMLElement, {
            quality: 1.0,
            pixelRatio: 2.5,
          });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const imgProps1 = pdf.getImageProperties(imgDataCustomer);
          const pdfHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
          pdf.addImage(
            imgDataCustomer,
            "PNG",
            0,
            0,
            pdfWidth,
            pdfHeight1,
            undefined,
            "FAST"
          );

          let pdfBytes = pdf.output("arraybuffer");
          let filePath = await save({
            title: `Save Customer Copy`,
            defaultPath: `Loan_${loanData.loan_id}_Customer_Copy.pdf`,
            filters: [{ name: "PDF Document", extensions: ["pdf"] }],
          });
          if (filePath) {
            await writeBinaryFile({
              path: filePath,
              contents: new Uint8Array(pdfBytes),
            });
          }

          const officePdf = new jsPDF("p", "mm", "a4", true);
          const officeContent = billContent.querySelector("#office-copy");
          if (!officeContent) throw new Error("Office copy content not found");

          const imgDataOffice = await toPng(officeContent as HTMLElement, {
            quality: 1.0,
            pixelRatio: 2.5,
          });
          const imgProps2 = officePdf.getImageProperties(imgDataOffice);
          const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
          officePdf.addImage(
            imgDataOffice,
            "PNG",
            0,
            0,
            pdfWidth,
            pdfHeight2,
            undefined,
            "FAST"
          );

          pdfBytes = officePdf.output("arraybuffer");
          filePath = await save({
            title: `Save Office Copy`,
            defaultPath: `Loan_${loanData.loan_id}_Office_Copy.pdf`,
            filters: [{ name: "PDF Document", extensions: ["pdf"] }],
          });
          if (filePath) {
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
  }, [isOpen, loanData, logo, setAlert, onClose]);

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
                <div className="absolute -left-[9999px] top-0" ref={billRef}>
                  <div id="customer-copy">
                    <BillPageContent
                      loanData={loanData}
                      logo={logo}
                      copyType="Customer"
                    />
                  </div>
                  <div id="office-copy">
                    <BillPageContent
                      loanData={loanData}
                      logo={logo}
                      copyType="Office"
                    />
                  </div>
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
