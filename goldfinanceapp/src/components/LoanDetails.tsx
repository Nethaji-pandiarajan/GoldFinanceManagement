// src/components/LoanDetails.tsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { PlusIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import ViewLoanModal from "./ViewLoanModal";
import LoanPaymentModal from "./LoanPaymentModal";
import clsx from 'clsx';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
DataTable.use(DT);

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

type LoanDetailsProps = {
  setActiveItem: (name: string) => void;
};

export default function LoanDetails({ setActiveItem }: LoanDetailsProps) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const tableRef = useRef<any>();

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/loans/${itemToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Loan deleted successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not delete loan.",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleActionClick = async (
    action: "view" | "edit" | "delete" | "payment",
    loan: any
  ) => {
    if (action === "delete") {
      setItemToDelete(loan.loan_id);
    } else if (action === "payment") {
      setPaymentData(loan);
    } else if (action === "view") {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/loans/${loan.loan_id}`
        );
        setViewData(response.data);
      } catch (error) {
        setAlert({
          show: true,
          type: "error",
          message: "Could not fetch loan details.",
        });
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

  const tableColumns = [
    { title: "Loan ID", data: "loan_id" },
    { title: "Customer Name", data: "customer_name" },
    {
      title: "Amount Issued",
      data: "amount_issued",
      render: (data: string) => `₹${parseFloat(data).toLocaleString("en-IN")}`,
    },
    {
      title: "Amount Paid",
      data: "principal_amount_paid",
      render: (data: string) => `₹${parseFloat(data).toLocaleString("en-IN")}`,
    },
    {
      title: "Interest Paid",
      data: "interest_paid",
      render: (data: string) => `₹${parseFloat(data).toLocaleString("en-IN")}`,
    },
    {
      title: "Interest Rate",
      data: "interest_rate",
      render: (data: string) => `${parseFloat(data).toFixed(2)}%`,
    },
    {
      title: "Due Date",
      data: "due_date",
      render: (data: string) => new Date(data).toLocaleDateString(),
    },
    { 
      title: 'Status', 
      data: 'completion_status',
      render: (data: string) => {
        const isCompleted = data === 'Completed';
        const badgeClass = isCompleted ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300';
        return `<span class="${clsx('px-2 py-1 text-xs font-semibold rounded-full', badgeClass)}">${data}</span>`;
      }
    },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (_data: any, _type: any, row: any) => {
        const paymentIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" /><path fill-rule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd" /></svg>`;
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return `
          <div class="flex items-center justify-center space-x-2">
            <button title="View Details" data-action="view" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-green-400 hover:bg-green-500/20">${viewIcon}</button>
            <button title="Make Payment" data-action="payment" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-yellow-400 hover:bg-yellow-500/20">${paymentIcon}</button>
            <button title="Delete Loan" data-action="delete" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-red-500 hover:bg-red-500/20">${deleteIcon}</button>
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
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      {viewData && (
        <ViewLoanModal loanData={viewData} onClose={() => setViewData(null)} />
      )}
      {paymentData && (
        <LoanPaymentModal
          loan={paymentData}
          onClose={() => setPaymentData(null)}
          onSuccess={handleSuccess}
          setAlert={setAlert}
        />
      )}
      {itemToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this loan?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">Loan Details</h1>
          <button
            onClick={() => setActiveItem("New Loan Application")}
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Loan Application
          </button>
        </div>
        <DataTable
          id="loanTable"
          ref={tableRef}
          className="display w-full"
          ajax={{ url: `${API_BASE_URL}/api/loans`, dataSrc: "" }}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer Name</th>
              <th>Amount Issued</th>
              <th>Amount Paid</th>
              <th>Interest Paid</th>
              <th>Interest Rate</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
