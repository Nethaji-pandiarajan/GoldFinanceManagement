// src/components/Sidebar.tsx
import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  DocumentPlusIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  CogIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

const originalNavigation = [
  { name: "Dashboard", icon: Squares2X2Icon, type: "secondary" },
  { name: "New Loan Application", icon: DocumentPlusIcon, type: "primary" },
  { name: "Customer Details", icon: UserGroupIcon, type: "secondary" },
  { name: "Ornaments Details", icon: BuildingStorefrontIcon, type: "default" },
  { name: "Gold Karat Details", icon: ScaleIcon, type: "default" },
  { name: "Gold Rate", icon: CurrencyDollarIcon, type: "default" },
  { name: "Processing Amount", icon: CogIcon, type: "default" },
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
  userRole,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigation = originalNavigation.filter((item) => {
    if (item.name === "Processing Amount") {
      return userRole === "super_admin";
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
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-[#c69909] hover:text-black"
        >
          {isExpanded ? (
            <XMarkIcon className="h-6 w-6 " />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      <nav className="flex flex-col space-y-2">
        {navigation.map((item) => {
          const isActive = activeItem === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveItem(item.name)}
              className={clsx(
                "group flex items-center p-3 rounded-lg text-left transition-colors duration-200",
                {
                  "bg-[#c69909] hover:text-black text-white font-semibold":
                    isActive,
                  "text-white hover:bg-[#c69909] hover:text-black": !isActive,
                  "justify-start": isExpanded,
                  "justify-center": !isExpanded,
                }
              )}
            >
              <item.icon
                className={clsx(
                  "h-6 w-6 shrink-0 transition-colors duration-200",
                  {
                    "text-black": isActive,
                    "text-[#c69909] group-hover:text-black": !isActive,
                  }
                )}
              />
              {isExpanded && <span className="ml-4 ">{item.name}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
