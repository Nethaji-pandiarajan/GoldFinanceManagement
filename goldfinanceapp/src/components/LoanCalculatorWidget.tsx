import { useState } from 'react';
import { Transition } from '@headlessui/react';
import { CalculatorIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const CalcRow = ({ label, value, isTotal = false, isSub = false, isBold = false }: { label: string; value: string; isTotal?: boolean, isSub?: boolean, isBold?: boolean }) => (
  <div className={`flex justify-between items-center py-1 ${isTotal ? 'border-t border-gray-600 pt-2 mt-1' : ''}`}>
    <span className={`text-sm ${isSub ? 'pl-4 text-gray-400' : 'text-gray-300'}`}>{label}:</span>
    <span className={`font-semibold ${isTotal ? 'text-lg text-[#c69909]' : 'text-white'} ${isBold ? 'font-bold' : ''}`}>{value}</span>
  </div>
);

interface CalculatorProps {
  eligibleAmount: number;
  amountIssued: number;
  interestRate: number;
  processingFee: number;
  startDate: string;
  endDate: string;
}

export default function LoanCalculatorWidget({ eligibleAmount, amountIssued, interestRate, processingFee, startDate, endDate }: CalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const calculateMonths = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    return months <= 0 ? 1 : months + 1;
  };
  
  const totalMonths = calculateMonths();
  const netAmountForInterest = Math.max(0, amountIssued - processingFee);
  
  const monthlyPrincipal = totalMonths > 0 ? netAmountForInterest / totalMonths : 0;
  const monthlyInterest = netAmountForInterest > 0 && interestRate > 0 ? (netAmountForInterest * (interestRate / 100)) / 12 : 0;
  const totalInterestPayable = monthlyInterest * totalMonths;
  const totalPayable = amountIssued + totalInterestPayable;
  const amountLeftToIssue = Math.max(0, eligibleAmount - amountIssued);

  const formatCurrency = (num: number) => `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed top-20 right-6 w-80 bg-[#111315]/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-40">
      <button className="w-full flex justify-between items-center p-3 text-left text-white font-bold" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center"><CalculatorIcon className="h-5 w-5 mr-2 text-[#c69909]" /><span>Loan Calculator</span></div>
        {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      <Transition show={isExpanded} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
        <div className="p-3 border-t border-gray-700 space-y-1">
          <CalcRow label="Total Eligible Amount" value={formatCurrency(eligibleAmount)} isBold={true} />
          <div className="py-2"><hr className="border-gray-600/50" /></div>
          <CalcRow label="Amount Issued" value={formatCurrency(amountIssued)} />
          <CalcRow label="Processing Fee" value={`(-) ${formatCurrency(processingFee)}`} isSub={true} />
          <CalcRow label="Net Amount (for interest)" value={formatCurrency(netAmountForInterest)} isSub={true} isBold={true} />
          <div className="py-2"><hr className="border-gray-600/50" /></div>
          <CalcRow label="Total Months" value={totalMonths.toString()} />
          <CalcRow label="Principal / Month" value={formatCurrency(monthlyPrincipal)} isSub={true} />
          <CalcRow label="Interest / Month" value={formatCurrency(monthlyInterest)} isSub={true} />
          <CalcRow label="Total Interest Payable" value={formatCurrency(totalInterestPayable)} isSub={true} />
          <CalcRow label="Total Payable Amount" value={formatCurrency(totalPayable)} isTotal={true} />
          <div className="py-2"><hr className="border-gray-600/50" /></div>
          <CalcRow label="Amount Left to Issue" value={formatCurrency(amountLeftToIssue)} isBold={true} />
        </div>
      </Transition>
    </div>
  );
}