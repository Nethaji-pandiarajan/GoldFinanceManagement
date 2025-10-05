import React, { useState, useEffect, useMemo } from "react";
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

        <div className="flex items-end gap-4 p-4 mb-6 bg-[#111315]">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#c69909] mb-1">
              Start Date
            </label>
            <CustomDatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#c69909] mb-1">
              End Date
            </label>
            <CustomDatePicker value={endDate} onChange={setEndDate} />
          </div>
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
