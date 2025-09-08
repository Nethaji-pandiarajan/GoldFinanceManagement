// src/components/CustomerDetails.tsx
import { useState, useEffect, useRef ,Fragment} from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import * as XLSX from 'xlsx';
import { save } from "@tauri-apps/api/dialog"; 
import { writeTextFile, writeBinaryFile } from "@tauri-apps/api/fs";
import AddCustomerForm from "./AddCustomerForm";
import ViewCustomerModal from "./ViewCustomerModal";
import { PlusIcon ,ArrowDownTrayIcon, ChevronDownIcon} from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import { Menu, Transition } from "@headlessui/react";
const API_BASE_URL = "http://localhost:4000"
DataTable.use(DT);
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;
export default function CustomerDetails() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const tableRef = useRef<any>();
  const generateCSVContent = (data: any[]) => {
    const headers = [
        "customer_id", "customer_name", "email", "phone_number", "gender", 
        "description", "address", "government_proof", "proof_id", "date_of_birth", 
        "current_address", "nominee_id", "nominee_name", "nominee_relationship", 
        "nominee_mobile", "nominee_age", "nominee_gender"
    ];
    const headerRow = headers.join(',');
    const dataRows = data.map(customer => {
        const row = headers.map(header => {
            let value = customer[header];
            if (header === 'date_of_birth' && value) {
                return new Date(value).toLocaleDateString('en-CA');
            }
            return value;
        });
        return row.map(val => `"${val || ''}"`).join(',');
    });
    return [headerRow, ...dataRows].join('\n');
  };
  const generateXLSXBuffer = (data: any[]) => {
        const formattedData = data.map(c => ({
            "Customer ID": c.customer_id,
            "Name": c.customer_name,
            "Email": c.email,
            "Phone": c.phone_number,
            "Gender": c.gender,
            "Description": c.description,
            "Permanent Address": c.address,
            "Govt Proof": c.government_proof,
            "Proof ID": c.proof_id,
            "Date of Birth": c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString('en-CA') : '',
            "Current Address": c.current_address,
            "Nominee ID": c.nominee_id,
            "Nominee Name": c.nominee_name,
            "Nominee Relationship": c.nominee_relationship,
            "Nominee Mobile": c.nominee_mobile,
            "Nominee Age": c.nominee_age,
            "Nominee Gender": c.nominee_gender,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return buffer;
    };
   const handleDownload = async (format: 'csv' | 'xlsx') => {
        try {
            const response = await api.get('/api/customers/export');
            const allCustomerData = response.data;

            if (!allCustomerData || allCustomerData.length === 0) {
                setAlert({ show: true, type: 'alert', message: 'No customer data available to export.' });
                return;
            }

            if (format === 'csv') {
                const content = generateCSVContent(allCustomerData);
                const filePath = await save({
                    defaultPath: 'all_customers.csv',
                    filters: [{ name: 'CSV File', extensions: ['csv'] }]
                });
                if (filePath) {
                    await writeTextFile({ path: filePath, contents: content });
                    setAlert({ show: true, type: 'success', message: 'CSV file saved successfully!' });
                }
            } else if (format === 'xlsx') {
                const buffer = generateXLSXBuffer(allCustomerData);
                const filePath = await save({
                    defaultPath: 'all_customers.xlsx',
                    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
                });
                if (filePath) {
                    await writeBinaryFile({ path: filePath, contents: buffer });
                    setAlert({ show: true, type: 'success', message: 'XLSX file saved successfully!' });
                }
            }
        } catch (error) {
            console.error("Failed to export file:", error);
            setAlert({ show: true, type: 'error', message: 'Failed to export the file.' });
        }
    };
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await api.delete(`/api/customers/${customerToDelete}`);
      tableRef.current?.dt().ajax.reload();
      setAlert({
        show: true,
        type: "success",
        message: "Customer deleted successfully!",
      });
    } catch (error) {
      console.error("Failed to delete customer:", error);
      setAlert({
        show: true,
        type: "error",
        message: "Could not delete customer.",
      });
    } finally {
      setCustomerToDelete(null);
    }
  };
  const handleActionClick = async (
    action: "view" | "edit" | "delete" | "notify",
    uuid: string
  ) => {
    if (action === "notify") {
      return;
    } else if (action === "delete") {
      setCustomerToDelete(uuid);
    } else {
      try {
        const response = await api.get(`/api/customers/${uuid}`);
        if (action === "view") {
          setViewData(response.data);
        } else if (action === "edit") {
          setEditData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch customer data for action:", error);
        setAlert({
          show: true,
          type: "error",
          message: "Could not delete customer.",
        });
      }
    }
  };
  useEffect(() => {
    const tableElement = document.getElementById("customerTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as
            | "view"
            | "edit"
            | "delete";
          const uuid = button.getAttribute("data-uuid");
          if (action && uuid) {
            handleActionClick(action, uuid);
          }
        }
      };

      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);
  const ajaxConfig = {
    url: `${API_BASE_URL}/api/customers`,
    dataSrc: "",
    headers: {
      'x-auth-token': localStorage.getItem('authToken') || ''
    }
  };
  const tableColumns = [
    {
      title: "S.No",
      render: function (_data: any, _type: any, _row: any, meta: any) {
        return meta.row + 1;
      },
      orderable: false,
      searchable: false,
    },
    { title: "Customer Name", data: "customer_name" },
    { title: "Phone Number", data: "phone_number" },
    { title: "Gender", data: "gender" },
    {
      title: "DOB",
      data: "dob",
      render: (data: string) =>
        data ? new Date(data).toLocaleDateString() : "N/A",
    },
    {
      title: "Actions",
      data: "customer_uuid",
      orderable: false,
      render: (data: string) => {
        const viewIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113zM12.001 18a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" clip-rule="evenodd" /></svg>`;
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return ` <div class="flex items-center justify-center space-x-4">
            <button title="View Details" data-action="view" data-uuid="${data}" class="p-2 rounded-full text-green-400 hover:bg-green-500/20 hover:text-green-200 transition-colors">${viewIcon}</button>
            <button title="Edit Customer" data-action="edit" data-uuid="${data}" class="p-2 rounded-full text-blue-400 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">${editIcon}</button>
            <button title="Delete Customer" data-action="delete" data-uuid="${data}" class="p-2 rounded-full text-red-500 hover:bg-red-500/20 hover:text-red-300 transition-colors">${deleteIcon}</button>
          </div>`;
      },
    },
  ];

  const handleSuccess = (mode: "add" | "edit") => {
    setAddModalOpen(false);
    setEditData(null);
    tableRef.current?.dt().ajax.reload(null, false);
    const message =
      mode === "add"
        ? "Customer created successfully!"
        : "Customer updated successfully!";
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
        <AddCustomerForm
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => handleSuccess("add")}
          setAlert={setAlert}
        />
      )}
      {editData && (
        <AddCustomerForm
          mode="edit"
          initialData={editData}
          onClose={() => setEditData(null)}
          onSuccess={() => handleSuccess("edit")}
          setAlert={setAlert}
        />
      )}
      {viewData && (
        <ViewCustomerModal
          customer={viewData}
          onClose={() => setViewData(null)}
        />
      )}
      {customerToDelete && (
        <ConfirmationDialog
          type="delete"
          message="Are you sure you want to delete this customer? This action is permanent."
          onConfirm={handleConfirmDelete}
          onCancel={() => setCustomerToDelete(null)}
        />
      )}
      {isAddModalOpen && (
        <AddCustomerForm
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => handleSuccess("add")}
          setAlert={setAlert}
        />
      )}
      {editData && (
        <AddCustomerForm
          mode="edit"
          initialData={editData}
          onClose={() => setEditData(null)}
          onSuccess={() => handleSuccess("edit")}
          setAlert={setAlert}
        />
      )}
      <div className="bg-[#111315] backdrop-blur-md p-6 rounded-lg shadow-lg border border-[#111315]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-20 text-[#c69909]">
            Customer Details
          </h1>
          <div className="flex items-center space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-gray-700/50 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export
                  <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition as={Fragment} >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-[#1f2628] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => handleDownload('csv')} className={`${active ? 'bg-[#111315] text-white' : 'text-gray-300'} block w-full text-left px-4 py-2 text-sm`}>
                          CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => handleDownload('xlsx')} className={`${active ? 'bg-[#111315] text-white' : 'text-gray-300'} block w-full text-left px-4 py-2 text-sm`}>
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
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Customer
          </button>
          </div>
        </div>

        <DataTable
          id="customerTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
          columns={tableColumns}
        >
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Actions</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </>
  );
}
