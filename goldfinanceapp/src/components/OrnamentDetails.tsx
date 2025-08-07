// src/components/OrnamentDetails.tsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import AddOrnamentForm from "./AddOrnamentForm";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import { PlusIcon } from "@heroicons/react/24/solid";
import ViewOrnamentModal from "./ViewOrnamentModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/ornaments/${itemToDelete}`);
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

  const handleActionClick = (action: "edit" | "delete", data: any) => {
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

  const tableColumns = [
    {
      title: "S.No",
      render: (data: any, type: any, row: any, meta: any) => meta.row + 1,
      orderable: false,
    },
    { title: "Ornament Type", data: "ornament_type" },
    { title: "Ornament Name", data: "ornament_name" },
    { title: "Description", data: "description" },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (data: any, type: any, row: any) => {
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
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Ornament
          </button>
        </div>
        <DataTable
          id="ornamentTable"
          ref={tableRef}
          className="display w-full"
          ajax={{ url: `${API_BASE_URL}/api/ornaments`, dataSrc: "" }}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>S.No</th>
              <th>Ornament Type</th>
              <th>Ornament Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
