import { useState, useEffect, useRef } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { PlusIcon,ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import ViewLoanModal from "./ViewLoanModal";
import LoanPaymentModal from "./LoanPaymentModal";
import clsx from 'clsx';
import ConfirmationDialog from "./ConfirmationDialog";
import * as XLSX from 'xlsx';
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";
const API_BASE_URL = "https://goldfinancemanagementtesting.onrender.com"
DataTable.use(DT);

const formatCurrency = (value: any) => `₹${parseFloat(String(value) || '0').toLocaleString("en-IN")}`;

type LoanDetailsProps = { setActiveItem: (name: string) => void; };

export default function LoanDetails({ setActiveItem }: LoanDetailsProps) {
  const [alert, setAlert] = useState<any>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const tableRef = useRef<any>();
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/loans/${itemToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Loan deleted successfully!",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Could not delete loan.";
      setAlert({ show: true, type: "error", message });
    } finally {
      setItemToDelete(null);
    }
  };
  const handleActionClick = async (action: "view" | "payment" | "delete", loan: any) => {
    if (action === "delete") {
      setItemToDelete(loan.loan_id);
    }else {
      try {
        const response = await api.get(`/api/loans/${loan.loan_id}`);
        setAlert(null);
        if (action === "view") {
          setViewData(response.data);
        } else if (action === "payment") {
          setPaymentData(response.data);
        }
      } catch (error) {
        setAlert({ show: true, type: "error", message: "Could not fetch full loan details." });
      }
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("loanTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as any;
          const rowData = JSON.parse(button.getAttribute("data-row") || "{}");
          if (action && rowData) handleActionClick(action, rowData);
        }
      };
      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);

  const ajaxConfig = {
    url: `${API_BASE_URL}/api/loans`,
    dataSrc: "",
    headers: { 'x-auth-token': localStorage.getItem('authToken') || '' }
  };
  const handleFullDownload = async () => {
    try {
      const response = await api.get('/api/loans/export-all');
      const { loan_details, ornament_details, payment_details } = response.data;

      if (!loan_details || loan_details.length === 0) {
        setAlert({ show: true, type: 'alert', message: 'No loan data available to export.' });
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws_loans = XLSX.utils.json_to_sheet(loan_details);
      XLSX.utils.book_append_sheet(wb, ws_loans, "Loan Details");
      const ws_ornaments = XLSX.utils.json_to_sheet(ornament_details);
      XLSX.utils.book_append_sheet(wb, ws_ornaments, "Ornament Details");
      const ws_payments = XLSX.utils.json_to_sheet(payment_details);
      XLSX.utils.book_append_sheet(wb, ws_payments, "Payment Details");
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const filePath = await save({ defaultPath: 'all_loan_data.xlsx', filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
      if (filePath) {
          await writeBinaryFile({ path: filePath, contents: buffer });
          setAlert({ show: true, type: 'success', message: 'File saved successfully!' });
      } else {
          setAlert(null);
      }
    } catch (error) {
      console.error("Failed to export file:", error);
      setAlert({ show: true, type: 'error', message: 'Failed to export the file.' });
    }
  };
  const tableColumns = [
    { title: "Loan ID", data: "loan_id" },
    { title: "Customer Name", data: "customer_name" },
    { title: "Net Principal Amount", data: "net_amount_issued", render: (data: any) => formatCurrency(data) },
    { title: "Total Interest Paid", data: "total_interest_paid", render: (data: any) => formatCurrency(data) },
    { 
      title: 'Status', 
      data: 'completion_status',
      render: (data: string) => `<span class="${clsx('px-2 py-1 text-xs font-semibold rounded-full', data === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300')}">${data}</span>`
    },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (_data: any, _type: any, row: any) => {
        const paymentIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" /><path fill-rule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd" /></svg>`;
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        const isCompleted = row.completion_status === 'Completed';
        const paymentButton = isCompleted
            ? `<button title="Payment not available for completed loans" class="p-2 rounded-full text-gray-600 cursor-not-allowed" disabled>${paymentIcon}</button>`
            : `<button title="Make Payment" data-action="payment" data-row='${JSON.stringify(row)}' class="p-2 rounded-full text-yellow-400 hover:bg-yellow-500/20">${paymentIcon}</button>`;
        return `
          <div class="flex items-center justify-center space-x-2">
            <button title="View Details" data-action="view" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-green-400 hover:bg-green-500/20">${viewIcon}</button>
            ${paymentButton}
            <button title="Delete Loan" data-action="delete" data-row='${JSON.stringify(row)}' class="p-2 rounded-full text-red-500 hover:bg-red-500/20">${deleteIcon}</button>
          </div>
        `;
      },
    },
  ];

  const handleSuccess = () => {
    tableRef.current?.dt().ajax.reload(null, false);
    if (paymentData) {
      setPaymentData(null);
      setAlert({
        show: true,
        type: "success",
        message: "Payment recorded successfully!",
      });
    }
  };

  return (
     <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      {viewData && <ViewLoanModal loanData={viewData} onClose={() => setViewData(null)} />}
      {paymentData && <LoanPaymentModal loan={paymentData} onClose={() => setPaymentData(null)} onSuccess={handleSuccess} setAlert={setAlert} />}
      {itemToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this loan? This will also delete all associated payments and pledged ornaments."
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">Loan Details</h1>
          <div className="flex items-center space-x-4">
          <button
              onClick={handleFullDownload}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-700/50 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
          >
              <ArrowDownTrayIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Export (XLSX)
          </button>
          <button
            onClick={() => setActiveItem("New Loan Application")}
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Loan Application
          </button>
          </div>
        </div>
        <DataTable
          id="loanTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer Name</th>
              <th>Net Principal Amount</th>
              <th>Total Interest Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
