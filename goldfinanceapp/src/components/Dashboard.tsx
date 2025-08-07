// src/components/Dashboard.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  UserGroupIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
type StatCardProps = {
  title: string;
  value: string;
  Icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  iconBgColor: string;
  iconColor: string;
};
const statsData: StatCardProps[] = [
  {
    title: "Total Customers",
    value: "1,245 +",
    Icon: UserGroupIcon,
    iconBgColor: "bg-blue-500/20",
    iconColor: "text-blue-300",
  },
  {
    title: "Total Loans",
    value: "832 +",
    Icon: DocumentTextIcon,
    iconBgColor: "bg-green-500/20",
    iconColor: "text-green-300",
  },
  {
    title: "Total Loan Amount",
    value: "₹50 L",
    Icon: BanknotesIcon,
    iconBgColor: "bg-indigo-500/20",
    iconColor: "text-indigo-300",
  },
  {
    title: "Total Interest",
    value: "₹38 L",
    Icon: ReceiptPercentIcon,
    iconBgColor: "bg-amber-500/20",
    iconColor: "text-amber-300",
  },
  {
    title: "In Hand (Amount)",
    value: "₹45 L",
    Icon: HandThumbUpIcon,
    iconBgColor: "bg-pink-500/20",
    iconColor: "text-pink-300",
  },
  {
    title: "Gold Rate (24K)",
    value: "₹7,150/g",
    Icon: ScaleIcon,
    iconBgColor: "bg-yellow-500/20",
    iconColor: "text-yellow-300",
  },
];
const loanData = [
  { name: "Jan", Approved: 4000, Pending: 2400 },
  { name: "Feb", Approved: 3000, Pending: 1398 },
  { name: "Mar", Approved: 2000, Pending: 9800 },
  { name: "Apr", Approved: 2780, Pending: 3908 },
  { name: "May", Approved: 1890, Pending: 4800 },
  { name: "Jun", Approved: 2390, Pending: 3800 },
];

const customerData = [
  { name: "Week 1", NewCustomers: 12 },
  { name: "Week 2", NewCustomers: 19 },
  { name: "Week 3", NewCustomers: 8 },
  { name: "Week 4", NewCustomers: 15 },
];

const StatCard = ({
  title,
  value,
  Icon,
  iconBgColor,
  iconColor,
}: StatCardProps) => (
  <div className="bg-black backdrop-blur-md p-4 rounded-lg shadow-2xs border border-black flex items-center space-x-4">
    <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColor}`}>
      <Icon className={`h-6 w-6 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm text-[#c69909]">{title}</p>
      <p className="text-2xl font-bold text-gray-400">{value}</p>
    </div>
  </div>
);
const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-black backdrop-blur-md p-6 rounded-lg shadow-xl border border-black">
    <h3 className="text-xl font-semibold mb-4 text-[#c69909]">{title}</h3>
    <div style={{ width: "100%", height: 300 }}>{children}</div>
  </div>
);

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#c69909] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsData.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            Icon={stat.Icon}
            iconBgColor={stat.iconBgColor}
            iconColor={stat.iconColor}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Loan Applications">
          <ResponsiveContainer>
            <BarChart data={loanData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pending" fill="#8884d8" />
              <Bar dataKey="Approved" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Customers / Week">
          <ResponsiveContainer>
            <LineChart data={customerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="NewCustomers"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/*<ChartCard title="Loan Distribution by Karat">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={karatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {karatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Processing Amount">
           <div className="h-full flex items-center justify-center">
             <p className="text-gray-400">Processing Amount Chart</p>
           </div>
        </ChartCard>*/}
      </div>
    </div>
  );
}
