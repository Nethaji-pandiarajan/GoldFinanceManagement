import { useState, useEffect, useRef, Fragment } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import AddSchemeForm from "./AddSchemeForm";
import EditSchemeForm from "./EditSchemeForm";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import ViewSchemeModal from "./ViewSchemeModal";
import { Menu, Transition } from "@headlessui/react";
import * as XLSX from "xlsx";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
const API_BASE_URL = "https://goldfinancemanagementtesting.onrender.com";
DataTable.use(DT);

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

export default function Schemes() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editSchemeId, setEditSchemeId] = useState<number | null>(null);
  const [schemeToDelete, setSchemeToDelete] = useState<number | null>(null);
  const [viewSchemeId, setViewSchemeId] = useState<number | null>(null);
  const tableRef = useRef<any>();
  const handleSchemeDownload = async (format: "csv" | "xlsx") => {
    try {
      const response = await api.get("/api/schemes/export");
      const data = response.data;

      if (format === "csv") {
        const headers = [
          "scheme_id",
          "scheme_name",
          "description",
          "created_by",
          "updated_by",
          "start_day",
          "end_day",
          "slab_interest_rate",
        ];
        const csvContent = [
          headers.join(","),
          ...data.map((row: any) =>
            headers.map((header) => `"${row[header] || ""}"`).join(",")
          ),
        ].join("\n");
        const filePath = await save({
          defaultPath: "schemes_export.csv",
          filters: [{ name: "CSV", extensions: ["csv"] }],
        });
        if (filePath)
          await writeTextFile({ path: filePath, contents: csvContent });
      } else if (format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Schemes");
        const buffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const filePath = await save({
          defaultPath: "schemes_export.xlsx",
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
  const handleActionClick = (
    action: "view" | "edit" | "delete",
    schemeId: number
  ) => {
    if (action === "view") {
      setViewSchemeId(schemeId);
    } else if (action === "edit") {
      setEditSchemeId(schemeId);
    } else if (action === "delete") {
      setSchemeToDelete(schemeId);
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("schemeTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as
            | "view"
            | "edit"
            | "delete";
          const id = button.getAttribute("data-id");
          if (action && id) {
            handleActionClick(action, parseInt(id, 10));
          }
        }
      };
      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);

  const handleSuccess = (mode: "add" | "edit") => {
    setAddModalOpen(false);
    setEditSchemeId(null);
    tableRef.current?.dt().ajax.reload(null, false);
    const message =
      mode === "add"
        ? "Scheme created successfully!"
        : "Scheme updated successfully!";
    setAlert({ show: true, type: "success", message });
  };

  const handleConfirmDelete = async () => {
    if (!schemeToDelete) return;
    try {
      await api.delete(`/api/schemes/${schemeToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Scheme deleted successfully!",
      });
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Could not delete scheme.",
      });
    } finally {
      setSchemeToDelete(null);
    }
  };

  const tableColumns = [
    { title: "ID", data: "scheme_id", width: "10%" },
    { title: "Scheme Name", data: "scheme_name" },
    { title: "Description", data: "description" },
    { title: "Last Updated By", data: "updated_by" },
    {
      title: "Actions",
      data: "scheme_id",
      orderable: false,
      searchable: false,
      width: "15%",
      render: (id: number) => {
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return `
                    <div class="flex items-center justify-center space-x-4">
                        <button title="View Scheme" data-action="view" data-id="${id}" class="p-2 rounded-full text-green-400 hover:bg-green-500/20">${viewIcon}</button>
                        <button title="Edit Scheme" data-action="edit" data-id="${id}" class="p-2 rounded-full text-blue-400 hover:bg-blue-500/20">${editIcon}</button>
                        <button title="Delete Scheme" data-action="delete" data-id="${id}" class="p-2 rounded-full text-red-500 hover:bg-red-500/20">${deleteIcon}</button>
                    </div>
                `;
      },
    },
  ];

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      {isAddModalOpen && (
        <AddSchemeForm
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => handleSuccess("add")}
          setAlert={setAlert}
        />
      )}
      {editSchemeId && (
        <EditSchemeForm
          schemeId={editSchemeId}
          onClose={() => setEditSchemeId(null)}
          onSuccess={() => handleSuccess("edit")}
          setAlert={setAlert}
        />
      )}
      {schemeToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this scheme and all its interest slabs?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setSchemeToDelete(null)}
        />
      )}
      {viewSchemeId && (
        <ViewSchemeModal
          schemeId={viewSchemeId}
          onClose={() => setViewSchemeId(null)}
          setAlert={setAlert}
        />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">
            Scheme Management
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
                          onClick={() => handleSchemeDownload("csv")}
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
                          onClick={() => handleSchemeDownload("xlsx")}
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
              <PlusIcon className="h-5 w-5 mr-2" /> Add Scheme
            </button>
          </div>
        </div>
        <DataTable
          id="schemeTable"
          ref={tableRef}
          className="display w-full"
          ajax={{
            url: `${API_BASE_URL}/api/schemes`,
            dataSrc: "",
            headers: {
              "x-auth-token": localStorage.getItem("authToken") || "",
            },
          }}
          columns={tableColumns}
        />
      </div>
    </>
  );
}
