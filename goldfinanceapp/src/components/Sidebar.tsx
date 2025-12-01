// src/components/Sidebar.tsx
import {
  Bars3Icon,
  ChevronDoubleLeftIcon,
  DocumentPlusIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  // CogIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  BanknotesIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

const originalNavigation = [
  { name: "Dashboard", icon: Squares2X2Icon },
  { name: "New Loan Application", icon: DocumentPlusIcon },
  { name: 'Loan Details', icon: DocumentTextIcon },
  { name: "Customer Details", icon: UserGroupIcon },
  { name: "Scheme details", icon: BeakerIcon },
  { name: "Total Investments", icon: BanknotesIcon, roles: ['super_admin'] },
  { name: "Expense Management", icon: ClipboardDocumentListIcon, roles: ['super_admin'] },
  { name: "Accounts", icon: ChartBarIcon, roles: ['super_admin'] },
  { name: "Ornaments Details", icon: BuildingStorefrontIcon },
  { name: "Gold Karat Details", icon: ScaleIcon },
  { name: "Gold Rate", icon: CurrencyDollarIcon },
  // { name: "Processing Amount", icon: CogIcon },
];

type SidebarProps = {
  activeItem: string;
  setActiveItem: (item: string) => void;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: string | null;
};

export default function Sidebar({
  activeItem,
  setActiveItem,
  isExpanded: parentIsExpanded,
  setIsExpanded: parentSetIsExpanded,
  userRole,
}: SidebarProps) {
  const isExpanded = parentIsExpanded;
  const setIsExpanded = parentSetIsExpanded;

  const navigation = originalNavigation.filter(item => {
    if (item.roles) {
      return item.roles.includes(userRole || '');
    }
    return true;
  });

  return (
    <aside
      className={clsx(
        "bg-[#111315] text-[#c69909] flex flex-col p-4 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className={clsx(
        "flex items-center mb-6",
        isExpanded ? "justify-center" : "justify-center"
      )}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-[#c69909] hover:text-black"
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? (
            <ChevronDoubleLeftIcon className="h-6 w-6" /> 
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      <nav className="flex flex-col space-y-2">
        {navigation.map((item) => {
          const isActive = activeItem === item.name;
          const IconComponent = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => setActiveItem(item.name)}
              className={clsx(
                "group flex items-center p-3 rounded-lg text-left transition-colors duration-200 w-full",
                {
                  "bg-[#c69909] text-black font-semibold": isActive,
                  "text-white hover:bg-[#c69909] hover:text-black": !isActive,
                  "justify-between": isExpanded,
                  "justify-center": !isExpanded,
                }
              )}
            >
              {!isExpanded && (
                <IconComponent className={clsx("h-6 w-6", isActive ? "text-black" : "text-[#c69909] group-hover:text-black")} />
              )}
              {isExpanded && (
                <>
                  <span className="flex-grow">{item.name}</span>
                  <IconComponent className={clsx("h-6 w-6 shrink-0", isActive ? "text-black" : "text-[#c69909] group-hover:text-black")} />
                </>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}