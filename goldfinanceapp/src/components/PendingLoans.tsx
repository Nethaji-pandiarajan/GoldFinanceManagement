import { useRef , useState , useEffect} from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import api from '../api';
import AlertNotification from './AlertNotification'; 
import ViewLoanModal from "./ViewLoanModal";
import LoanPaymentModal from "./LoanPaymentModal";
const API_BASE_URL = "http://localhost:4000"
const formatCurrency = (value: string | number) => `₹${parseFloat(String(value) || '0').toLocaleString("en-IN")}`;
DataTable.use(DT);
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;
// interface PendingLoanData {
//   loan_id: number;
//   customer_name: string;
//   phone: string;
//   principal_due: string;
//   interest_due: string;
//   next_payment_month: string;
// }
export default function PendingLoans() {
  const tableRef = useRef<any>();
  const [alert, setAlert] = useState<AlertState>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const handleActionClick = async (action: "view" | "payment", loan: any) => {
    try {
      const response = await api.get(`/api/loans/${loan.loan_id}`);
      if (action === "view") {
        setViewData(response.data);
      } else if (action === "payment") {
        setPaymentData(response.data);
      }
    } catch (error) {
      setAlert({ show: true, type: "error", message: "Could not fetch full loan details." });
    }
  };
  useEffect(() => {
    const tableElement = document.getElementById('pendingLoanTable');
    if (tableElement) {
        const listener = (event: Event) => {
            const target = event.target as HTMLElement;
            const button = target.closest("button[data-action]");;
            if (button) {
                const action = button.getAttribute("data-action") as "view" | "payment";
                const loanData = JSON.parse(button.getAttribute("data-loan") || "{}");
                if (action && loanData.loan_id) {
                    handleActionClick(action, loanData);
                }
            }
        };
        tableElement.addEventListener('click', listener);
        return () => tableElement.removeEventListener('click', listener);
    }
  }, []);
  // const handleSendReminder = async (loanData : PendingLoanData) => {
  //   setAlert({ show: true, type: 'alert', message: `Sending reminder for Loan #${loanData.loan_id}...` });
  //   try {
  //       const payload = {
  //           customer_name: loanData.customer_name,
  //           phone: loanData.phone, 
  //           amount_due: loanData.principal_due,
  //           interest_due: loanData.interest_due
  //       };
  //       await api.post(`/api/loans/${loanData.loan_id}/remind`, payload);
  //       setAlert({ show: true, type: 'success', message: 'Reminder sent successfully!' });
  //   } catch (error) {
  //       setAlert({ show: true, type: 'error', message: 'Failed to send reminder.' });
  //   }
  // };
  
  const ajaxConfig = {
    url: `${API_BASE_URL}/api/loans/pending`,
    dataSrc: '',
    headers: {
      'x-auth-token': localStorage.getItem('authToken') || ''
    }
  };

  const tableColumns = [
    { title: "Loan ID", data: "loan_id" },
    { title: "Customer Name", data: "customer_name" },
    { title: "Scheme", data: "scheme_name" },
    { 
      title: "Total Principal", 
      data: "total_principal_amount",
      render: (data: string) => formatCurrency(data),
    },
    { 
      title: "Principal Paid", 
      data: "principal_amount_paid",
      render: (data: string) => formatCurrency(data),
    },
    { 
      title: "Total Interest Due", 
      data: "total_interest_due",
      render: (data: string) => formatCurrency(data),
    },
    { 
      title: "Interest Paid", 
      data: "total_interest_paid",
      render: (data: string) => formatCurrency(data),
    },
    {
      title: "Interest Rate",
      data: "interest_rate",
      render: (data: string) => `${parseFloat(data).toFixed(2)}%`,
    },
    {
      title: "Final Due Date",
      data: "due_date",
      render: (data: string) => new Date(data).toLocaleDateString(),
    },
    {
      title: "Actions",
      data: null,
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: any) => {
          const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-green-400 group-hover:text-green-200"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
          const paymentIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-yellow-400 group-hover:text-yellow-200"><path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" /><path fill-rule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd" /></svg>`;
          return `<div class="flex items-center justify-center space-x-2">
              <button title="View Details" data-action="view" data-loan='${JSON.stringify(row)}' class="group p-2 rounded-full hover:bg-green-500/20">${viewIcon}</button>
              <button title="Make Payment" data-action="payment" data-loan='${JSON.stringify(row)}' class="group p-2 rounded-full hover:bg-yellow-500/20">${paymentIcon}</button>
          </div>`;
      }
    }

    // {
    //     title: "Notify",
    //     data: null, // Notify logic might need adjustment if it relied on next_payment_month
    //     orderable: false,
    //     searchable: false,
    //     render: (_data : any, _type : any, row : any) => {
    //         // NOTE: The reminder logic might need to be re-evaluated
    //         // as we no longer fetch the "next_payment_month" specifically.
    //         // For now, let's keep the icon.
    //         const notifyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.67-.253-3.287-.673-4.83-1.243a.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0L12 17.9l-2.248.002z" clip-rule="evenodd" /></svg>`;
    //         return `<div class="flex items-center justify-center"><button title="Send Payment Reminder" data-action="notify" data-loan='${JSON.stringify(row)}' class="p-2 rounded-full text-yellow-400 hover:bg-yellow-500/20">${notifyIcon}</button></div>`;
    //     }
    // }
  ];
  const handlePaymentSuccess = () => {
    tableRef.current?.dt().ajax.reload(null, false);
    setPaymentData(null);
    setAlert({ show: true, type: "success", message: "Payment recorded successfully!" });
  };
  return (
    <>
    {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
    {viewData && <ViewLoanModal loanData={viewData} onClose={() => setViewData(null)} />}
    {paymentData && <LoanPaymentModal loan={paymentData} onClose={() => setPaymentData(null)} onSuccess={handlePaymentSuccess} setAlert={setAlert} />}
    <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-[#c69909] mb-4">Pending Loans</h1>
      <DataTable
        id="pendingLoanTable"
        ref={tableRef}
        className="display w-full"
        ajax={ajaxConfig}
        columns={tableColumns}
      >
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Customer Name</th>
            <th>Scheme</th>
            <th>Total Principal</th>
            <th>Principal Paid</th>
            <th>Total Interest Due</th>
            <th>Interest Paid</th>
            <th>Interest Rate</th>
            <th>Final Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
      </DataTable>
    </div>
  </>
  );
}