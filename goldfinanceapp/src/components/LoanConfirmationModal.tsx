import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="py-2">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-lg text-white font-semibold">{value || "N/A"}</p>
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loanDetails: any;
  customer: any;
  ornaments: any[];
  loading: boolean;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} /* ... backdrop ... */>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} /* ... panel ... */>
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#111315] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-[#c69909]"
                >
                  Confirm Loan Details
                </Dialog.Title>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                  {/* Customer and Loan Details */}
                  <section>
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
                      Loan & Customer
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                      <DetailItem label="Customer" value={customer?.name} />
                      <DetailItem
                        label="Nominee"
                        value={customer?.nominee_name}
                      />
                      <DetailItem
                        label="Amount Issued"
                        value={`₹ ${parseFloat(
                          loanDetails.amount_issued || 0
                        ).toLocaleString("en-IN")}`}
                      />
                      <DetailItem
                        label="Interest Rate"
                        value={`${loanDetails.interest_rate}%`}
                      />
                      <DetailItem
                        label="Due Date"
                        value={new Date(
                          loanDetails.due_date
                        ).toLocaleDateString()}
                      />
                    </div>
                  </section>

                  {/* Ornament Details */}
                  <section>
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
                      Ornaments Pledged ({ornaments.length})
                    </h4>
                    <div className="space-y-2">
                      {ornaments.map((orn, index) => (
                        <div
                          key={index}
                          className="p-2 bg-[#1f2628] rounded-md text-sm"
                        >
                          {`${orn.grams}g of ${orn.karat} ${orn.material_type} ${orn.ornament_name}`}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold"
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Confirm & Submit"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}