import { useState, useEffect, useRef } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import ViewLoanModal from "./ViewLoanModal";
import AlertNotification from "./AlertNotification";
import api from "../api";
const API_BASE_URL = "http://localhost:4000";
DataTable.use(DT);

export default function ClosedLoans() {
  const [viewData, setViewData] = useState<any | null>(null);
  const [alert, setAlert] = useState<any>(null);

  const tableRef = useRef<any>();

  const handleViewClick = async (loan: any) => {
    try {
      const response = await api.get(`/api/loans/${loan.loan_id}`);
      setAlert(null);
      setViewData(response.data);
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not fetch full loan details.",
      });
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("closedLoanTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action='view']");
        if (button) {
          const rowData = JSON.parse(button.getAttribute("data-row") || "{}");
          if (rowData) {
            handleViewClick(rowData);
          }
        }
      };
      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);

  const ajaxConfig = {
    url: `${API_BASE_URL}/api/loans/closed`,
    dataSrc: "",
    headers: {
      "x-auth-token": localStorage.getItem("authToken") || "",
    },
  };
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
      title: "Actions",
      data: null,
      orderable: false,
      render: (_data: any, _type: any, row: any) => {
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        return `
          <div class="flex items-center justify-center">
            <button title="View Details" data-action="view" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-green-400 hover:bg-green-500/20">
              ${viewIcon}
            </button>
          </div>
        `;
      },
    },
  ];

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      {viewData && (
        <ViewLoanModal loanData={viewData} onClose={() => setViewData(null)} />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#c69909] mb-4">Closed Loans</h1>
        <DataTable
          id="closedLoanTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
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
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}