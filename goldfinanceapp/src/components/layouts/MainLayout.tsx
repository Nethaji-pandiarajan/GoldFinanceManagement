import Sidebar from '../Sidebar';
import Dashboard from '../Dashboard';
import TopNavbar from '../TopNavbar';
import CustomerDetails from '../CustomerDetails';
import { useState } from 'react';
import OrnamentDetails from '../OrnamentDetails';
import GoldKaratDetails from '../GoldKaratDetails';
import GoldRateDetails from '../GoldRateDetails';
/*import BackgroundImage from '../../assets/mainlayoutbg3.png';*/

type MainLayoutProps = {
  onLogout: () => void;
  userRole: string | null;
};

export default function MainLayout({ onLogout , userRole }: MainLayoutProps) {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);
  const renderContent = () => {
    switch (activeItem) {
      case 'Customer Details':
        return <CustomerDetails />;
      case 'Ornaments Details':
        return <OrnamentDetails />;
      case 'Gold Karat Details':
        return <GoldKaratDetails />;
      case 'Gold Rate':
        return <GoldRateDetails />;
      case 'Dashboard':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <div className="h-screen bg-[#1f2628] bg-cover bg-center ">
      <div className="relative h-full w-full bg-black/10">
        <div className="fixed top-0 left-0 right-0 z-20">
          <TopNavbar onLogout={onLogout} />
        </div>

        <div className="flex pt-14 h-full">
          <Sidebar 
            activeItem={activeItem} 
            setActiveItem={setActiveItem}
            isExpanded={isSidebarExpanded}
            setIsExpanded={setSidebarExpanded}
            userRole={userRole}
          />
          <main className="flex-1 p-8 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}