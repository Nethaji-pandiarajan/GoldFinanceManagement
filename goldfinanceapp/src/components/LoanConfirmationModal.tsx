import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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

const SectionHeader = ({ title }: { title: string }) => (
  <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">{title}</h4>
);

const DetailItem = ({ label, value, className = '' }: { label: string; value: any, className?: string }) => (
  <div className={className}>
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    <p className="font-semibold text-white break-words">{value || 'N/A'}</p>
  </div>
);

export default function LoanConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loanDetails,
  customer,
  ornaments,
  loading,
  customerDisplayDetails,
  selectedScheme,
  loanImagePreview
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loanDetails: any;
  customer: any;
  ornaments: any[];
  loading: boolean;
  customerDisplayDetails: any;
  selectedScheme : any;
  loanImagePreview: string | null;
}) {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !loading && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#111315] border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-[#c69909]">
                  Please Confirm Loan Details
                </Dialog.Title>
                <div className="mt-4 max-h-[70vh] overflow-y-auto pr-3 space-y-6">
                  
                  <section>
                    <SectionHeader title="Loan Details" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DetailItem label="Loan ID" value={loanDetails.loan_id} />
                      <DetailItem label="Scheme" value={selectedScheme?.scheme_name} />
                      <DetailItem label="Interest Rate" value={`${loanDetails.interest_rate}%`} />
                      <DetailItem label="Loan Date & Time" value={new Date(loanDetails.loan_datetime).toLocaleString()} />
                      <DetailItem label="Due Date" value={new Date(loanDetails.due_date).toLocaleDateString()} />
                    </div>
                  </section>
                  
                  <section>
                    <SectionHeader title="Customer Details" />
                    <div className="grid grid-cols-3 gap-x-8">
                        <div className="col-span-2 space-y-4">
                            <DetailItem label="Customer Name & Phone" value={`${customer?.name} (${customer?.phone})`} />
                             <div className="grid grid-cols-3 gap-4">
                                <DetailItem label="Gender" value={customerDisplayDetails?.gender} />
                                <DetailItem label="Date of Birth" value={customerDisplayDetails?.date_of_birth ? new Date(customerDisplayDetails.date_of_birth).toLocaleDateString() : 'N/A'} />
                                <DetailItem label="Nominee" value={`${customerDisplayDetails?.nominee_name} (${customerDisplayDetails?.nominee_mobile})`} />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">\
                            <DetailItem label="Customer Image" value="" />
                            <div className="w-32 h-40 bg-black/20 rounded-md border border-gray-700 flex items-center justify-center">
                                {customerDisplayDetails?.customer_image ? <img src={bufferToBase64(customerDisplayDetails.customer_image)??undefined} alt="Customer" className="w-full h-full object-cover rounded-md" /> : <span className="text-gray-500 text-sm">No Image</span>}
                            </div>
                        </div>
                    </div>
                  </section>

                  <section>
                    <SectionHeader title={`Ornaments Pledged (${ornaments.length})`} />
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1f2628] text-gray-300 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Ornament Name</th>
                            <th className="p-3">Material</th>
                            <th className="p-3">Gross weight</th>
                            <th className="p-3">Net weight</th>
                            <th className="p-3">Karat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {ornaments.map((orn, index) => (
                            <tr key={index} className="hover:bg-white/5">
                              <td className="p-3 font-semibold text-white">{orn.ornament_name}</td>
                              <td className="p-3 text-gray-300">{orn.material_type}</td>
                              <td className="p-3 text-gray-300">{orn.gross_weight}g</td>
                              <td className="p-3 text-gray-300">{orn.net_weight}g</td>
                              <td className="p-3 text-gray-300">{orn.karat}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {loanImagePreview && (
                      <div className="mt-6 flex flex-col items-center">
                        <p className="text-sm font-semibold text-gray-300 mb-2">
                          Ornament Image Preview
                        </p>
                        <img
                          src={loanImagePreview}
                          alt="Pledged Ornaments"
                          className="max-h-64 w-auto rounded-lg border-2 border-gray-600 object-contain"
                        />
                      </div>
                    )}
                  </section>

                  <section>
                    <SectionHeader title="Final Amounts & Fees" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-lg">
                        <DetailItem label="Eligible Amount" value={formatCurrency(loanDetails.eligible_amount)} />
                        <DetailItem label="Amount Issued" value={formatCurrency(loanDetails.amount_issued)} />
                        <DetailItem label="Processing Fee" value={formatCurrency(loanDetails.processing_fee)} />
                    </div>
                  </section>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button type="button" className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold" onClick={onClose} disabled={loading}>Cancel</button>
                  <button type="button" className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold" onClick={onConfirm} disabled={loading}>{loading ? "Processing..." : "Confirm & Proceed"}</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}