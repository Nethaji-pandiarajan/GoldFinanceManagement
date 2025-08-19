import React from 'react';
import DatePicker from 'react-datepicker';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
}

const CustomInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909] flex justify-between items-center text-left"
    >
      <span>{value || 'Select date'}</span>
      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
    </button>
  )
);

export default function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      customInput={<CustomInput />}
    />
  );
}