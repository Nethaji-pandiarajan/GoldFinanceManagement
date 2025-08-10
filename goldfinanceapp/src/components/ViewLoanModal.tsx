// src/components/ViewLoanModal.tsx
import clsx from 'clsx';

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="py-2">
    <p className="text-sm text-gray-400 font-medium">{label}</p>
    <p className="text-lg text-white font-semibold break-words">{value || 'N/A'}</p>
  </div>
);

export default function ViewLoanModal({ loanData, onClose }: { loanData: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-[#c69909] mb-6">Loan Details for {loanData.customer_name}</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Loan Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
            <DetailItem label="Loan ID" value={loanData.loan_id} />
            <DetailItem label="Amount Issued" value={`₹${parseFloat(loanData.amount_issued).toLocaleString('en-IN')}`} />
            <DetailItem label="Principal Paid" value={`₹${parseFloat(loanData.principal_amount_paid).toLocaleString('en-IN')}`} />
            <DetailItem label="Interest Rate" value={`${loanData.interest_rate}%`} />
            <DetailItem label="Loan Date" value={new Date(loanData.loan_datetime).toLocaleString()} />
            <DetailItem label="Final Due Date" value={new Date(loanData.due_date).toLocaleDateString()} />
          </div>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Interest Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-sm text-gray-400">
                <tr>
                  <th className="p-2">Month</th>
                  <th className="p-2">Amount Due</th>
                  <th className="p-2">Amount Paid</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Payment Date</th>
                  <th className="p-2">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {loanData.interest_payments && loanData.interest_payments.map((p: any) => (
                  <tr key={p.interest_payment_id} className="border-b border-gray-800 text-white">
                    <td className="p-2">{new Date(p.payment_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                    <td className="p-2">₹{parseFloat(p.amount_due).toLocaleString('en-IN')}</td>
                    <td className="p-2">₹{parseFloat(p.amount_paid).toLocaleString('en-IN')}</td>
                    <td className="p-2">
                      <span className={clsx('px-2 py-1 text-xs font-semibold rounded-full', {
                        'bg-green-500/20 text-green-300': p.payment_status === 'Paid',
                        'bg-yellow-500/20 text-yellow-300': p.payment_status === 'Partial',
                        'bg-red-500/20 text-red-300': p.payment_status === 'Pending',
                      })}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="p-2">{p.payment_date ? new Date(p.payment_date).toLocaleString() : 'N/A'}</td>
                    <td className="p-2">{p.payment_mode || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}