// src/components/TopNavbar.tsx
import { useState, useEffect, useRef } from "react";
import {
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import ConfirmationDialog from "./ConfirmationDialog";
import clsx from "clsx";
import CreateUserForm from "./CreateUserForm";
import AlertNotification from "./AlertNotification";

interface User {
  id: number;
  username: string;
  role: string;
  firstName: string;
}

type TopNavbarProps = {
  onLogout: () => void;
  setActiveItem: (name: string) => void;
  user: User;
};
export default function TopNavbar({ onLogout, setActiveItem , user}: TopNavbarProps) {
  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isReportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const reportsDropdownRef = useRef<HTMLDivElement>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [alert, setAlert] = useState<any>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
      if (
        reportsDropdownRef.current &&
        !reportsDropdownRef.current.contains(event.target as Node)
      ) {
        setReportsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleLogoutClick = () => {
    setAccountDropdownOpen(false);
    setShowLogoutConfirm(true);
  };
  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      {showLogoutConfirm && (
        <ConfirmationDialog
          type="logout"
          message="Are you sure you want to logout?"
          onConfirm={onLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      {showCreateUserModal && (
        <CreateUserForm 
            onClose={() => setShowCreateUserModal(false)}
            onSuccess={() => {
                setShowCreateUserModal(false);
                setAlert({ show: true, type: 'success', message: 'User created successfully!' });
            }}
        />
      )}
      <header className="bg-[#111315] backdrop-blur-md h-16 flex items-center justify-between px-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#c69909]">
          Maaya Gold Finance
        </h1>
        <div className="flex items-center space-x-6">
          <div className="relative" ref={reportsDropdownRef}>
            <button
              onClick={() => setReportsDropdownOpen(!isReportsDropdownOpen)}
              className="flex items-center space-x-1.5 text-[#c69909] font-semibold transition-colors hover:text-white"
            >
              <span>Reports</span>
              <ChevronDownIcon
                className={clsx(
                  "h-4 w-4 transition-transform",
                  isReportsDropdownOpen && "rotate-180"
                )}
              />
            </button>
            {isReportsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-[#1f2628] rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setActiveItem("Closed Loans");
                    setReportsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-[#111315]"
                >
                  Closed
                </button>
                <button
                  onClick={() => {
                    setActiveItem("Pending Loans");
                    setReportsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-[#111315]"
                >
                  Pending
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={accountDropdownRef}>
            <button
              onClick={() => setAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center space-x-2 text-[#c69909] font-semibold transition-colors hover:text-white"
            >
              <UserCircleIcon className="h-6 w-6" />
              <span>Welcome, {user.firstName}!</span>
              <ChevronDownIcon className={clsx("h-4 w-4 transition-transform", isAccountDropdownOpen && "rotate-180")} />
            </button>
            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1f2628] rounded-md shadow-lg py-1 z-20">
                {user.role === 'super_admin' && (
                  <>
                    <button
                      onClick={() => {
                        setActiveItem('Manage Users');
                        setAccountDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-[#111315] hover:text-white"
                    >
                      <UsersIcon className="h-5 w-5 mr-3" />
                      Manage Users
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateUserModal(true);
                        setAccountDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-[#111315] hover:text-white"
                    >
                      <UserPlusIcon className="h-5 w-5 mr-3" />
                      Create New User
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    setActiveItem('My Profile');
                    setAccountDropdownOpen(false);
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-[#111315] hover:text-white"
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  My Profile
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-[#c69909] hover:bg-red-500 hover:text-white"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
