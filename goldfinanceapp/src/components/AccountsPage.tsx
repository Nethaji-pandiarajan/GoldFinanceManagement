import React, { useState, useEffect, useMemo, useCallback  } from "react";
import api from "../api";
import CustomDatePicker from "./DatePicker";
import AlertNotification from "./AlertNotification";

interface AccountRecord {
  txn_date: string;
  principal_paid: string;
  interest_paid: string;
  processing_amount: string;
  expense: string;
  total: string;
}

const formatCurrency = (value: string | number) => {
  const num = parseFloat(String(value));
  if (isNaN(num)) return "₹ 0.00";
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const AccountsPage: React.FC = () => {
  const [allData, setAllData] = useState<AccountRecord[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); 

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/api/accounts");
        setAllData(response.data);
      } catch (err: any) {
        setAlert({
          show: true,
          type: "error",
          message:
            err.response?.data?.message || "Failed to fetch accounts data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);


  const overallGrandTotals = useMemo(() => {
    return allData.reduce(
      (acc, row) => {
        acc.principal_paid += parseFloat(row.principal_paid) || 0;
        acc.interest_paid += parseFloat(row.interest_paid) || 0;
        acc.processing_amount += parseFloat(row.processing_amount) || 0;
        acc.expense += parseFloat(row.expense) || 0;
        acc.total += parseFloat(row.total) || 0;
        return acc;
      },
      {
        principal_paid: 0,
        interest_paid: 0,
        processing_amount: 0,
        expense: 0,
        total: 0,
      }
    );
  }, [allData]);

  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters((prev) => !prev);
  }, []);

  const filteredData = useMemo(() => {
    return allData.filter((row) => {
      const rowDate = new Date(row.txn_date);
      const checkDate = new Date(
        rowDate.getFullYear(),
        rowDate.getMonth(),
        rowDate.getDate()
      );

      if (startDate) {
        const start = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        if (checkDate < start) return false;
      }
      if (endDate) {
        const end = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        );
        if (checkDate > end) return false;
      }
      return true;
    });
  }, [allData, startDate, endDate]);

  const grandTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.principal_paid += parseFloat(row.principal_paid) || 0;
        acc.interest_paid += parseFloat(row.interest_paid) || 0;
        acc.processing_amount += parseFloat(row.processing_amount) || 0;
        acc.expense += parseFloat(row.expense) || 0;
        acc.total += parseFloat(row.total) || 0;
        return acc;
      },
      {
        principal_paid: 0,
        interest_paid: 0,
        processing_amount: 0,
        expense: 0,
        total: 0,
      }
    );
  }, [filteredData]);

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      <div className="p-4 bg-[#111315] rounded-lg text-white">
        <h1 className="text-2xl font-bold mb-4 text-[#c69909]">
          Accounts Summary
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-[#1f2628] rounded-lg text-center">
          <div>
            <p className="text-sm text-gray-400">Principal Paid (All)</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(overallGrandTotals.principal_paid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Interest Paid (All)</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(overallGrandTotals.interest_paid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Processing Fee (All)</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(overallGrandTotals.processing_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Expense (All)</p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(overallGrandTotals.expense)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total (All)</p>
            <p className="text-xl font-bold text-[#c69909]">
              {formatCurrency(overallGrandTotals.total)}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <button
            onClick={toggleAdvancedFilters}
            className="flex items-center text-[#c69909] hover:text-yellow-500 font-semibold text-sm px-3 py-2 rounded-md transition-colors duration-200 bg-[#111315]"
          >
            Advanced Filters
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {showAdvancedFilters && (
            <div className="flex flex-col md:flex-row items-end gap-4 p-4 mt-4 bg-[#111315] rounded-lg transition-all duration-300 ease-in-out">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date
                </label>
                <CustomDatePicker value={startDate} onChange={setStartDate} />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date
                </label>
                <CustomDatePicker value={endDate} onChange={setEndDate} />
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto bg-[#111315] ">
          {isLoading ? (
            <div className="text-center p-10">Loading Accounts Data...</div>
          ) : (
            <table className="min-w-full border-2 border-[#000000] divide-y divide-black bg-[#111315]">
              <thead className="bg-[#111315]">
                <tr>
                  <th className="px-6 py-3 text-left text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Principal Paid
                  </th>
                  <th className="px-6 py-3 text-right text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Interest Paid
                  </th>
                  <th className="px-6 py-3 text-right text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Processing Amount
                  </th>
                  <th className="px-6 py-3 text-right text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-6 py-3 text-right text-bold text-sm font-medium text-[#c69909] uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#111315] divide-y divide-black">
                {filteredData.map((row, index) => (
                  <tr key={index} className="hover:bg-[#c6990980]">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(row.txn_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-400">
                      {formatCurrency(row.principal_paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-400">
                      {formatCurrency(row.interest_paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-400">
                      {formatCurrency(row.processing_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-400">
                      {formatCurrency(row.expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#0a0b0c]">
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-3 text-right font-bold text-[#c69909] uppercase"
                  >
                    Grand Total
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-green-400">
                    {formatCurrency(grandTotals.principal_paid)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-green-400">
                    {formatCurrency(grandTotals.interest_paid)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-green-400">
                    {formatCurrency(grandTotals.processing_amount)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-red-400">
                    {formatCurrency(grandTotals.expense)}
                  </td>
                  <td className="px-6 py-3 text-right font-extrabold text-lg">
                    {formatCurrency(grandTotals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountsPage;
