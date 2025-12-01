import { useState } from 'react';
import { Transition } from '@headlessui/react';
import { CalculatorIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const CalcRow = ({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) => (
  <div className={`flex justify-between items-center py-1 ${isTotal ? 'border-t border-gray-600 pt-2 mt-1' : ''}`}>
    <span className="text-sm text-gray-300">{label}:</span>
    <span className={`font-semibold ${isTotal ? 'text-lg text-[#c69909]' : 'text-white'}`}>{value}</span>
  </div>
);

interface CalculatorProps {
  eligibleAmount: number;
  amountIssued: number;
  processingFee: number;
}

export default function LoanCalculatorWidget({ eligibleAmount, amountIssued, processingFee }: CalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const netAmountIssued = amountIssued;
  const formatCurrency = (num: number) => `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-[#111315]/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-40">
      <button className="w-full flex justify-between items-center p-3 text-left text-white font-bold" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center"><CalculatorIcon className="h-5 w-5 mr-2 text-[#c69909]" /><span>Quick Summary</span></div>
        {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      <Transition show={isExpanded} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
        <div className="p-3 border-t border-gray-700 space-y-1">
          <CalcRow label="Eligible Amount" value={formatCurrency(eligibleAmount)} />
          <CalcRow label="Amount Issued" value={formatCurrency(amountIssued)} />
          <CalcRow label="Processing Fee" value={`${formatCurrency(processingFee)}`} />
          <CalcRow label="Net Amount to Customer" value={formatCurrency(netAmountIssued)} isTotal={true} />
        </div>
      </Transition>
    </div>
  );
}