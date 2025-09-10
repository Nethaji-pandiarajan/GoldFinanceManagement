//src/components//layouts/mainlayout
import Sidebar from "../Sidebar";
import Dashboard from "../Dashboard";
import TopNavbar from "../TopNavbar";
import CustomerDetails from "../CustomerDetails";
import { useState } from "react";
import OrnamentDetails from "../OrnamentDetails";
import GoldKaratDetails from "../GoldKaratDetails";
import GoldRateDetails from "../GoldRateDetails";
import ProcessingAmount from "../ProcessingAmount";
import Breadcrumb from "../Breadcrumb";
import NewLoanApplication from "../NewLoanApplication";
import LoanDetails from '../LoanDetails';
import PendingLoans from '../PendingLoans';
import ClosedLoans from '../ClosedLoans';
import TotalInvestments from "../TotalInvestments";
import ProfilePage from "../ProfilePage";
import Schemes from "../Schemes";
import UserManagement from "../UserManagement";
import SettingsPage from "../SettingsPage";
import ExpenseManagement from "../ExpenseManagement";
interface User {
  id: number;
  username: string;
  role: string;
  firstName: string;
}

type MainLayoutProps = {
  onLogout: () => void;
  user: User;
};

export default function MainLayout({ onLogout, user }: MainLayoutProps) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);
  const renderContent = () => {
    switch (activeItem) {
      case 'Loan Details':
        return <LoanDetails setActiveItem={setActiveItem} />; 
      case 'New Loan Application':
        return <NewLoanApplication />;
      case "Customer Details":
        return <CustomerDetails />;
      case "Ornaments Details":
        return <OrnamentDetails />;
      case "Expense Management":
        return <ExpenseManagement />;
      case "Gold Karat Details":
        return <GoldKaratDetails />;
      case 'Total Investments':
        return <TotalInvestments />;
      case "Gold Rate":
        return <GoldRateDetails />;
      case "Dashboard":
        return <Dashboard />;
      case "Manage Users":
        return <UserManagement />;
      case "Processing Amount":
        return <ProcessingAmount />;
      case 'Pending Loans':
        return <PendingLoans />;
      case 'Closed Loans':
        return <ClosedLoans />;
      case 'My Profile':
        return <ProfilePage />;
      case "Scheme details":
        return <Schemes />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <div className="h-screen bg-[#1f2628] bg-cover bg-center ">
      <div className="relative h-full w-full bg-black/10">
        <div className="fixed top-0 left-0 right-0 z-20">
          <TopNavbar onLogout={onLogout} setActiveItem={setActiveItem} user={user} />
        </div>

        <div className="flex pt-14 h-full">
          <Sidebar
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            isExpanded={isSidebarExpanded}
            setIsExpanded={setSidebarExpanded}
            userRole={user.role}
          />
          <main className="flex-1 p-8 overflow-y-auto">
            <Breadcrumb currentPage={activeItem} />
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
