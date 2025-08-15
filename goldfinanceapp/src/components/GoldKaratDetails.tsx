// src/components/GoldKaratDetails.tsx
import { useState, useEffect, useRef } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import AddGoldKaratForm from "./AddGoldKaratForm";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import { PlusIcon } from "@heroicons/react/24/solid";
const allKaratOptions = ["24K", "22K", "20K", "18K", "14K", "10K", "Others"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
DataTable.use(DT);

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

export default function GoldKaratDetails() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const tableRef = useRef<any>();
  console.log("GoldKaratDetails component rendered",viewData);
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/karats/${itemToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Karat detail deleted successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not delete karat detail.",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleActionClick = (action: "view" | "edit" | "delete", data: any) => {
    if (action === "delete") {
      setItemToDelete(data.karat_id);
    } else if (action === "edit") {
      setEditData(data);
    } else if (action === "view") {
      setViewData(data);
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("karatTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as
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
    url: `${API_BASE_URL}/api/karats`,
    dataSrc: (json: any) => {
      setTableData(json);
      return json;
    },
    headers: {
      'x-auth-token': localStorage.getItem('authToken') || ''
    }
  };
  const tableColumns = [
    {
      title: "S.No",
      render: (_data: any, _type: any, _row: any, meta: any) => meta.row + 1,
      orderable: false,
    },
    { title: "Karat Name", data: "karat_name" },
    {
      title: "Loan to Value (LTV)",
      data: "loan_to_value",
      render: (data: string) => `${parseFloat(data).toFixed(2)}%`,
    },
    {
      title: "Purity",
      data: "purity",
      render: (data: string) => data ? `${parseFloat(data).toFixed(2)}%` : 'N/A',
    },
    { title: "Description", data: "description" },
    {
      title: "Actions",
      data: null,
      orderable: false,
      render: (_data: any, _type: any, row: any) => {
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return `
          <div class="flex items-center justify-center space-x-4">
            <button title="Edit Karat" data-action="edit" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-blue-400 hover:bg-blue-500/20 hover:text-blue-200">${editIcon}</button>
            <button title="Delete Karat" data-action="delete" data-row='${JSON.stringify(
              row
            )}' class="p-2 rounded-full text-red-500 hover:bg-red-500/20 hover:text-red-300">${deleteIcon}</button>
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
        ? "Karat detail created successfully!"
        : "Karat detail updated successfully!";
    setAlert({ show: true, type: "success", message: message });
  };
  const existingKaratNames = tableData.map(karat => karat.karat_name);
  const availableKaratOptions = allKaratOptions.filter(
    option => !existingKaratNames.includes(option) || option === 'Others'
  );
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
        <AddGoldKaratForm
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => handleSuccess("add")}
          setAlert={setAlert}
          availableOptions={availableKaratOptions} 
        />
      )}
      {editData && (
        <AddGoldKaratForm
          mode="edit"
          initialData={editData}
          onClose={() => setEditData(null)}
          onSuccess={() => handleSuccess("edit")}
          setAlert={setAlert}
          availableOptions={allKaratOptions} 
        />
      )}
      {itemToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this karat detail?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">
            Gold Karat Details
          </h1>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Karat Detail
          </button>
        </div>
        <DataTable
          id="karatTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Karat Name</th>
              <th>Loan to Value (LTV)</th>
              <th>Purity</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
