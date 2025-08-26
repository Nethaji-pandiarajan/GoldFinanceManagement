import { useRef } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';

const API_BASE_URL = "https://goldfinancemanagement.onrender.com"
DataTable.use(DT);

export default function ClosedLoans() {
  const tableRef = useRef<any>();
  const ajaxConfig = {
    url: `${API_BASE_URL}/api/loans/closed`,
    dataSrc: '',
    headers: {
      'x-auth-token': localStorage.getItem('authToken') || ''
    }
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
  ];

  return (
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
          </tr>
        </thead>
      </DataTable>
    </div>
  );
}