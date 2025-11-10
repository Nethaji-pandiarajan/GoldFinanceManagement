import { useState, useRef, Fragment } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import {
  PlusIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import InvestmentModal from "./InvestmentModal";
import { Menu, Transition } from "@headlessui/react";
import * as XLSX from "xlsx";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
const API_BASE_URL = "https://goldfinancemanagementtesting.onrender.com";
DataTable.use(DT);

export default function TotalInvestments() {
  const [alert, setAlert] = useState<any>(null);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"add" | "remove">("add");
  const tableRef = useRef<any>();

  const handleOpenModal = (action: "add" | "remove") => {
    setModalAction(action);
    setModalOpen(true);
  };
  const handleInvestmentDownload = async (format: "csv" | "xlsx") => {
    try {
      const response = await api.get("/api/investments/export");
      const data = response.data;

      if (!data || data.length === 0) {
        setAlert({
          show: true,
          type: "alert",
          message: "No investment data to export.",
        });
        return;
      }

      if (format === "csv") {
        const headers = [
          "id",
          "added_on",
          "added_by",
          "amount_added",
          "current_balance",
          "remarks",
        ];
        const csvContent = [
          headers.join(","),
          ...data.map((row: any) =>
            headers.map((header) => `"${row[header] || ""}"`).join(",")
          ),
        ].join("\n");

        const filePath = await save({
          defaultPath: "investment_history.csv",
          filters: [{ name: "CSV", extensions: ["csv"] }],
        });
        if (filePath)
          await writeTextFile({ path: filePath, contents: csvContent });
      } else if (format === "xlsx") {
        const formattedData = data.map((row: any) => ({
          "Transaction ID": row.id,
          Date: new Date(row.added_on).toLocaleString(),
          "Processed By": row.added_by,
          Amount: row.amount_added,
          "Running Balance": row.current_balance,
          Remarks: row.remarks,
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Investment History");

        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const filePath = await save({
          defaultPath: "investment_history.xlsx",
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
        });
        if (filePath)
          await writeBinaryFile({ path: filePath, contents: buffer });
      }
      setAlert({
        show: true,
        type: "success",
        message: "File saved successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Failed to export file.",
      });
    }
  };
  const handleTransactionSubmit = async (formData: {
    amount: string;
    remarks: string;
    action: "add" | "remove";
  }) => {
    setModalOpen(false);
    try {
      await api.post("/api/investments", formData);
      setAlert({
        show: true,
        type: "success",
        message: "Transaction recorded successfully!",
      });
      tableRef.current?.dt().ajax.reload();
    } catch (error: any) {
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || "Transaction failed.",
      });
    }
  };

  const ajaxConfig = {
    url: `${API_BASE_URL}/api/investments`,
    dataSrc: (json: any) => {
      setGrandTotal(parseFloat(json.grandTotal || "0"));
      return json.transactions;
    },
    headers: { "x-auth-token": localStorage.getItem("authToken") || "" },
  };

  const tableColumns = [
    {
      title: "Added Date",
      data: "added_on",
      render: (data: string) => new Date(data).toLocaleString(),
    },
    {
      title: "Transaction Amount",
      data: "amount_added",
      render: (data: string) => {
        const amount = parseFloat(data);
        const isCredit = amount >= 0;
        return `<span class="${
          isCredit ? "text-green-400" : "text-red-400"
        } font-semibold">${isCredit ? "+" : "-"} ₹${Math.abs(
          amount
        ).toLocaleString("en-IN")}</span>`;
      },
    },
    {
      title: "Current Balance",
      data: "current_balance",
      render: (data: string) => `₹${parseFloat(data).toLocaleString("en-IN")}`,
    },
    { title: "Added By", data: "added_by" },
    { title: "Remarks", data: "remarks" },
  ];

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      {isModalOpen && (
        <InvestmentModal
          action={modalAction}
          onClose={() => setModalOpen(false)}
          onSuccess={handleTransactionSubmit}
          currentBalance={grandTotal}
        />
      )}
      <div className="space-y-8">
        <div className="bg-[#111315] p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#c69909]">
              Total Investment
            </h1>
          </div>

          <div className="bg-[#1f2628] border-2 border-[#c69909]/30 rounded-lg p-8 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <BanknotesIcon className="h-16 w-16 text-[#c69909]" />
            <div>
              <p className="text-xl font-semibold text-gray-300 text-center">
                Grand Total Invested
              </p>
              <p className="text-5xl font-bold text-white text-center mt-2">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex justify-center space-x-6 mt-10">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleOpenModal("add")}
                className="flex items-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
              >
                <PlusIcon className="h-6 w-6 mr-2" />
                Add Investment
              </button>
            </div>
            {/* <button 
              onClick={() => handleOpenModal("remove")} 
              className="flex items-center bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
            >
              <MinusIcon className="h-6 w-6 mr-2" /> 
              Remove Investment
            </button> */}
          </div>
        </div>
        <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#c69909]">
              Transaction History
            </h2>
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-gray-700/50 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download
                  <ChevronDownIcon
                    className="-mr-1 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-[#1f2628] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleInvestmentDownload("csv")}
                          className={`${
                            active ? "bg-[#111315] text-white" : "text-gray-300"
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          Export as CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleInvestmentDownload("xlsx")}
                          className={`${
                            active ? "bg-[#111315] text-white" : "text-gray-300"
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          Export as XLSX
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          <DataTable
            ref={tableRef}
            id="investmentHistoryTable"
            className="display w-full"
            ajax={ajaxConfig}
            columns={tableColumns}
          />
        </div>
      </div>
    </>
  );
}
