import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const formatCurrency = (value: any) =>
  `₹${parseFloat(String(value) || "0").toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className="font-semibold text-white break-words">{value || "N/A"}</p>
  </div>
);
const SectionHeader = ({ title }: { title: string }) => (
  <h4 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
    {title}
  </h4>
);

const SummaryCard = ({ label, value, colorClass = 'text-white' }: { label: string, value: string, colorClass?: string }) => (
    <div className="bg-black/20 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold ${colorClass}`}>{value}</p>
    </div>
);

export default function ViewLoanModal({
  loanData,
  onClose,
}: {
  loanData: any;
  onClose: () => void;
}) {
  if (!loanData) return null;
  const remainingBalance = parseFloat(loanData.net_amount_issued) - parseFloat(loanData.principal_amount_paid);
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#111315] border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-[#c69909]"
                >
                  Loan Details for {loanData.customer_name} (ID:{" "}
                  {loanData.loan_id})
                </Dialog.Title>
                <div className="mt-4 max-h-[75vh] overflow-y-auto pr-2 space-y-6">
                  <section>
                    <SectionHeader title="Loan Summary" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <DetailItem
                        label="Net Principal Amount"
                        value={formatCurrency(loanData.net_amount_issued)}
                      />
                      <DetailItem
                        label="Original Interest Rate"
                        value={`${loanData.interest_rate}%`}
                      />
                      {loanData.current_interest_rate && (
                        <DetailItem
                          label="Current Penalty Rate"
                          value={`${loanData.current_interest_rate}%`}
                        />
                      )}
                      {loanData.penalty_applied_on && (
                        <DetailItem
                          label="Penalty Applied On"
                          value={new Date(
                            loanData.penalty_applied_on
                          ).toLocaleDateString()}
                        />
                      )}
                      <DetailItem
                        label="Loan Date"
                        value={new Date(
                          loanData.loan_datetime
                        ).toLocaleString()}
                      />
                      <DetailItem
                        label="Final Due Date"
                        value={new Date(loanData.due_date).toLocaleDateString()}
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeader title="Customer & Nominee" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DetailItem
                        label="Customer Name"
                        value={loanData.customer_name}
                      />
                      <DetailItem label="Phone" value={loanData.phone} />
                      <DetailItem
                        label="Nominee Name"
                        value={loanData.nominee_name}
                      />
                      <DetailItem
                        label="Nominee Phone"
                        value={loanData.nominee_mobile}
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeader
                      title={`Pledged Ornaments (${
                        loanData.ornaments?.length || 0
                      })`}
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-gray-400">
                          <tr>
                            <th className="p-2">Ornament Name</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Material</th>
                            <th className="p-2">Grams</th>
                            <th className="p-2">Karat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanData.ornaments?.map((orn: any) => (
                            <tr
                              key={orn.loan_ornament_id}
                              className="border-b border-gray-800 text-white"
                            >
                              <td className="p-2 font-semibold">
                                {orn.ornament_name}
                              </td>
                              <td className="p-2 text-gray-300">
                                {orn.ornament_type}
                              </td>
                              <td className="p-2 text-gray-300">
                                {orn.material_type}
                              </td>
                              <td className="p-2 text-gray-300">
                                {parseFloat(orn.grams).toFixed(2)}g
                              </td>
                              <td className="p-2 text-gray-300">{orn.karat}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <SectionHeader title="Payment Schedule" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <SummaryCard label="Total Principal Amount" value={formatCurrency(loanData.net_amount_issued)} colorClass="text-blue-300" />
                        <SummaryCard label="Total Paid" value={formatCurrency(loanData.principal_amount_paid)} colorClass="text-green-300" />
                        <SummaryCard label="Remaining Balance" value={formatCurrency(remainingBalance)} colorClass="text-yellow-300" />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-gray-400">
                          <tr>
                            <th className="p-2">Month</th>
                            <th className="p-2">Principal Balance</th>
                            <th className="p-2">Principal Paid</th>
                            <th className="p-2">Interest Due</th>
                            <th className="p-2">Interest Paid</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanData.payments?.map((p: any) => (
                            <tr
                              key={p.payment_id}
                              className="border-b border-gray-800 text-white"
                            >
                              <td className="p-2">
                                {new Date(p.payment_month).toLocaleDateString(
                                  "en-US",
                                  { month: "short", year: "numeric" }
                                )}
                              </td>
                              <td className="p-2">
                                {formatCurrency(p.loan_balance)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(p.principal_amount_paid)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(p.interest_amount_due)}
                              </td>
                              <td className="p-2">
                                {formatCurrency(p.interest_amount_paid)}
                              </td>
                              <td className="p-2">
                                <span
                                  className={clsx(
                                    "px-2 py-1 text-xs font-semibold rounded-full",
                                    {
                                      "bg-green-500/20 text-green-300":
                                        p.payment_status === "Paid",
                                      "bg-yellow-500/20 text-yellow-300":
                                        p.payment_status === "Partial",
                                      "bg-red-500/20 text-red-300":
                                        p.payment_status === "Pending",
                                    }
                                  )}
                                >
                                  {p.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
