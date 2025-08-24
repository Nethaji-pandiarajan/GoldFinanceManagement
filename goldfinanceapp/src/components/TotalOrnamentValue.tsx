import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₹ 0.00';
    return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface OrnamentWithValue {
    ornament_name: string;
    value: number;
}

interface TotalOrnamentValueProps {
    ornamentsWithValue: OrnamentWithValue[];
}

export default function TotalOrnamentValue({ ornamentsWithValue }: TotalOrnamentValueProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const grandTotal = ornamentsWithValue.reduce((total, orn) => total + orn.value, 0);

    return (
        <div className="bg-black/20 rounded-lg border border-gray-700/50">
            <button
                type="button"
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-grow">
                    <p className="text-xl text-bold text-white">Total Ornament Value</p>
                    <p className="text-sm font-bold text-gray-400">
                        {formatCurrency(grandTotal)}
                    </p>
                </div>
                {isExpanded ? (
                    <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                )}
            </button>
            <div className={clsx("transition-all duration-300 ease-in-out overflow-hidden", isExpanded ? "max-h-96" : "max-h-0")}>
                <div className="border-t border-gray-700/50 p-4 space-y-2">
                    {ornamentsWithValue.length > 0 ? (
                        ornamentsWithValue.map((orn, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-white">{orn.ornament_name || 'Unnamed Ornament'}</span>
                                <span className="font-semibold text-gray-300">{formatCurrency(orn.value)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center">No ornaments added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}