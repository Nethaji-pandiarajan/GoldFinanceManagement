// src/components/Breadcrumb.tsx
import React from "react";
import { HomeIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import {
  Squares2X2Icon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const pageIcons: { [key: string]: React.ElementType } = {
  Dashboard: Squares2X2Icon,
  "Customer Details": UserGroupIcon,
  "Ornaments Details": BuildingStorefrontIcon,
  "Gold Karat Details": ScaleIcon,
  "Gold Rate": CurrencyDollarIcon,
  "Processing Amount": CogIcon,
};

type BreadcrumbProps = {
  currentPage: string;
};

export default function Breadcrumb({ currentPage }: BreadcrumbProps) {
  const Icon = pageIcons[currentPage] || Squares2X2Icon;

  return (
    <nav
      className="flex items-center text-sm font-semibold mb-6"
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <a
            href="#"
            className="inline-flex items-center text-gray-300 hover:text-white"
          >
            <HomeIcon className="w-5 h-3.5 mr-2" />
            Home
          </a>
        </li>
        <li className="inline-flex items-center">
          <div className="flex items-center">
            <ChevronRightIcon className="w-5 h-5 text-gray-500 mx-1" />
            <span className="text-white inline-flex items-center">
              <Icon className="w-5 h-4 mr-2" />
              {currentPage}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
}
