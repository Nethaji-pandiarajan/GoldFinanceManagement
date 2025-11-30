// src/components/OrnamentDetails.tsx
import _React, { useState, useEffect, useRef, Fragment } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import AddOrnamentForm from "./AddOrnamentForm";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import ViewOrnamentModal from "./ViewOrnamentModal";
import { Menu, Transition } from "@headlessui/react";
import * as XLSX from "xlsx";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
const API_BASE_URL = "https://goldfinancemanagement.onrender.com";
DataTable.use(DT);

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

export default function OrnamentDetails() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const tableRef = useRef<any>();
  const handleOrnamentDownload = async (format: "csv" | "xlsx") => {
    try {
      const response = await api.get("/api/ornaments/export");
      const data = response.data;

      if (!data || data.length === 0) {
        setAlert({
          show: true,
          type: "alert",
          message: "No ornament data to export.",
        });
        return;
      }

      if (format === "csv") {
        const headers = [
          "ornament_id",
          "ornament_type",
          "ornament_name",
          "description",
          "created_on",
          "updated_on",
          "material_type",
        ];
        const csvContent = [
          headers.join(","),
          ...data.map((row: any) =>
            headers.map((header) => `"${row[header] || ""}"`).join(",")
          ),
        ].join("\n");

        const filePath = await save({
          defaultPath: "ornament_details.csv",
          filters: [{ name: "CSV", extensions: ["csv"] }],
        });
        if (filePath)
          await writeTextFile({ path: filePath, contents: csvContent });
      } else if (format === "xlsx") {
        const formattedData = data.map((row: any) => ({
          "Ornament ID": row.ornament_id,
          "Ornament Type": row.ornament_type,
          "Ornament Name": row.ornament_name,
          "Material Type": row.material_type,
          Description: row.description,
          "Created On": new Date(row.created_on).toLocaleString(),
          "Updated On": new Date(row.updated_on).toLocaleString(),
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ornaments");

        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const filePath = await save({
          defaultPath: "ornament_details.xlsx",
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
        });
        if (filePath)
          await writeBinaryFile({ path: filePath, contents: buffer });
      }
      setAlert({
        show: true,
        type: "success",
        message: "File saved successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Failed to export file.",
      });
    }
  };
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/ornaments/${itemToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Ornament deleted successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not delete ornament.",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleActionClick = (action: "view" | "edit" | "delete", data: any) => {
    if (action === "delete") {
      setItemToDelete(data.ornament_id);
    } else if (action === "edit") {
      setEditData(data);
    } else if (action === "view") {
      setViewData(data);
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("ornamentTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as
            | "view"
            | "edit"
            | "delete";
          const rowData = JSON.parse(button.getAttribute("data-row") || "{}");
          if (action && rowData) {
            handleActionClick(action, rowData);
          }
        }
      };
      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);
  const ajaxConfig = {
    url: `${API_BASE_URL}/api/ornaments`,
    dataSrc: "",
    headers: {
      "x-auth-token": localStorage.getItem("authToken") || "",
    },
  };
  const tableColumns = [
    {
      title: "S.No",
      render: (_data: any, _type: any, _row: any, meta: any) => meta.row + 1,
      orderable: false,
    },
    { title: "Ornament Type", data: "ornament_type" },
    { title: "Ornament Name", data: "ornament_name" },
    { title: "Material Type", data: "material_type" },
    { title: "Description", data: "description" },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (_data: any, _type: any, row: any) => {
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return `
          <div class="flex items-center justify-center space-x-4">
            <button title="View Details" data-action="view" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-green-400 hover:bg-green-500/20 hover:text-green-200 transition-colors">${viewIcon}</button>
            <button title="Edit Ornament" data-action="edit" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-blue-400 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">${editIcon}</button>
            <button title="Delete Ornament" data-action="delete" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-red-500 hover:bg-red-500/20 hover:text-red-300 transition-colors">${deleteIcon}</button>
          </div>
        `;
      },
    },
  ];

  const handleSuccess = (mode: "add" | "edit") => {
    setAddModalOpen(false);
    setEditData(null);
    tableRef.current?.dt().ajax.reload(null, false);
    const message =
      mode === "add"
        ? "Ornament created successfully!"
        : "Ornament updated successfully!";
    setAlert({ show: true, type: "success", message: message });
  };

  return (
    <>
      {alert?.show && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      {isAddModalOpen && (
        <AddOrnamentForm
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => handleSuccess("add")}
          setAlert={setAlert}
        />
      )}
      {editData && (
        <AddOrnamentForm
          mode="edit"
          initialData={editData}
          onClose={() => setEditData(null)}
          onSuccess={() => handleSuccess("edit")}
          setAlert={setAlert}
        />
      )}
      {viewData && (
        <ViewOrnamentModal
          ornament={viewData}
          onClose={() => setViewData(null)}
        />
      )}
      {itemToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this ornament?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">
            Ornament Details
          </h1>
          <div className="flex items-center space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-gray-700/50 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export
                  <ChevronDownIcon
                    className="-mr-1 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-[#1f2628] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleOrnamentDownload("csv")}
                          className={`${
                            active ? "bg-[#111315] text-white" : "text-gray-300"
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleOrnamentDownload("xlsx")}
                          className={`${
                            active ? "bg-[#111315] text-white" : "text-gray-300"
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          XLSX
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Ornament
            </button>
          </div>
        </div>
        <DataTable
          id="ornamentTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>S.No</th>
              <th>Ornament Type</th>
              <th>Ornament Name</th>
              <th>Material Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
