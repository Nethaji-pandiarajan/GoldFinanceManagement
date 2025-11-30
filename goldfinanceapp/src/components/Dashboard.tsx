import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { UserGroupIcon, DocumentTextIcon, BanknotesIcon, ReceiptPercentIcon, ScaleIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = "https://goldfinancemanagement.onrender.com"

const StatCard = ({ title, value, Icon, iconBgColor, iconColor, isLoading }: any) => (
  <div className="bg-[#111315] p-4 rounded-lg shadow-lg flex items-center space-x-4">
    <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColor}`}>
      <Icon className={`h-6 w-6 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm text-[#c69909]">{title}</p>
      {isLoading ? (
        <div className="h-8 w-24 bg-gray-700/50 animate-pulse rounded-md mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-300">{value}</p>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, children, isLoading }: any) => (
  <div className="bg-[#111315] p-6 rounded-lg shadow-xl">
    <h3 className="text-xl font-semibold mb-4 text-[#c69909]">{title}</h3>
    <div style={{ width: '100%', height: 300 }}>
      {isLoading ? (
        <div className="w-full h-full bg-gray-700/50 animate-pulse rounded-md"></div>
      ) : (
        children
      )}
    </div>
  </div>
);
const formatCurrency = (value: string | number) => {
    const num = parseFloat(String(value));
    if (isNaN(num)) return '₹ 0';

    if (num >= 10000000) { 
        return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
        return `₹ ${(num / 100000).toFixed(2)} L`;
    }
    return `₹ ${num.toLocaleString('en-IN')}`;
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get(`${API_BASE_URL}/api/dashboard/stats`, {
          headers: { 'x-auth-token': token }
        });
        setStats(response.data);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statsData = [
    { title: "Total Customers", value: stats?.totalCustomers, Icon: UserGroupIcon, iconBgColor: "bg-blue-500/20", iconColor: "text-blue-300" },
    { title: "Total Loans", value: stats?.totalLoans, Icon: DocumentTextIcon, iconBgColor: "bg-green-500/20", iconColor: "text-green-300" },
    { title: "Total Loan Amount", value: formatCurrency(stats?.totalLoanAmount), Icon: BanknotesIcon, iconBgColor: "bg-indigo-500/20", iconColor: "text-indigo-300" },
    { title: "Total Interest Paid", value: formatCurrency(stats?.totalInterest), Icon: ReceiptPercentIcon, iconBgColor: "bg-amber-500/20", iconColor: "text-amber-300" },
    { title: "Total Investment", value: formatCurrency(stats?.totalInvestment), Icon: BanknotesIcon, iconBgColor: "bg-pink-500/20", iconColor: "text-pink-300" },
    { title: "Gold Rate (22K)", value: `₹ ${parseFloat(stats?.goldRate22k || 0).toLocaleString('en-IN')}/g`, Icon: ScaleIcon, iconBgColor: "bg-yellow-500/20", iconColor: "text-yellow-300" },
  ];

  if (error) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#c69909] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} isLoading={loading} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Loan Status" isLoading={loading}>
          <ResponsiveContainer>
            <BarChart data={stats?.monthlyLoanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="month" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
              <Legend />
              <Bar dataKey="Pending" fill="#ECC94B" />
              <Bar dataKey="Completed" fill="#48BB78" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Customers (Last 4 Weeks)" isLoading={loading}>
          <ResponsiveContainer>
            <LineChart data={stats?.weeklyCustomerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="week" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
              <Legend />
              <Line type="monotone" dataKey="NewCustomers" stroke="#3182CE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}