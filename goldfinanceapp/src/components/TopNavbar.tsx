// src/components/TopNavbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {  UserCircleIcon, ArrowLeftOnRectangleIcon ,} from '@heroicons/react/24/solid';
import ConfirmationDialog from './ConfirmationDialog';
type TopNavbarProps = {
  onLogout: () => void;
};

export default function TopNavbar({ onLogout }: TopNavbarProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };
  return (
    <>
      {showLogoutConfirm && (
        <ConfirmationDialog
          type="logout"
          message="Are you sure you want to logout?"
          onConfirm={onLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      <header className="bg-[#111315] backdrop-blur-md h-16 flex items-center justify-between px-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#c69909]">
          Maaya Gold Finance
        </h1>
        <div className="flex items-center space-x-6">
          <button className="text-[#c69909] font-semibold transition-colors">
            Reports
          </button>

          {/* My Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
              <button
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className="group bg-[#1f2628] p-2 rounded-full transition-colors hover:bg-[#c69909]"
              >
                  <UserCircleIcon className="h-6 w-6 text-[#c69909] transition-colors group-hover:text-black" />
            </button>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1f2628] rounded-md shadow-lg py-1 z-20">
                <Link
                  to="#"
                  className="flex items-center px-4 py-2 text-sm text-[#c69909] hover:text-[#ffffff]"
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  Profile
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-[#c69909] hover:text-red-600"
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