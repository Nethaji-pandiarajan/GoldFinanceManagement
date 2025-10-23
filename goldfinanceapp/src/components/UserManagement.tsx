import { useState, useEffect, useRef } from "react";
import api from "../api";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { PlusIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import EditUserModal from "./EditUserModal";
import CreateUserForm from "./CreateUserForm";
import PasswordConfirmationModal from "./PasswordConfirmationModal";

const API_BASE_URL = "https://goldfinancemanagementtesting.onrender.com";
DataTable.use(DT);
type ConfirmingAction = {
  type: 'add' | 'edit' | 'delete';
  data?: any;
} | null;

export default function UserManagement() {
  const [alert, setAlert] = useState<any>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const tableRef = useRef<any>();
  const [confirmingAction, setConfirmingAction] = useState<ConfirmingAction>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const performActionAfterVerification = async (password: string) => {
    setIsVerifying(true);
    setPasswordError(null);

    try {
      await api.post('/api/auth/verify-password', { password });
      let successMessage = "";
      if (confirmingAction?.type === 'add') {
        await api.post('/api/auth/signup', confirmingAction.data);
        successMessage = "User created successfully!";
      } else if (confirmingAction?.type === 'edit') {
        await api.put(`/api/admin/users/${confirmingAction.data.user_id}`, confirmingAction.data.formData);
        successMessage = "User updated successfully!";
      } else if (confirmingAction?.type === 'delete') {
        await api.delete(`/api/admin/users/${confirmingAction.data.user_id}`);
        successMessage = "User deleted successfully!";
      }
      
      setAlert({ show: true, type: 'success', message: successMessage });
      tableRef.current?.dt().ajax.reload();
      closeAllModals();

    } catch (error: any) {
      setPasswordError(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const closeAllModals = () => {
    setConfirmingAction(null);
    setPasswordError(null);
    setEditData(null);
      setAddModalOpen(false);
  };

  const handleActionClick = (action: "edit" | "delete", user: any) => {
    if (action === "edit") {
      setEditData(user);
    } else if (action === "delete") {
      setConfirmingAction({ type: 'delete', data: user });
    }
  };

  useEffect(() => {
    const tableElement = document.getElementById("userTable");
    if (tableElement) {
      const listener = (event: Event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button[data-action]");
        if (button) {
          const action = button.getAttribute("data-action") as "edit" | "delete";
          const userData = JSON.parse(button.getAttribute("data-user") || "{}");
          if (action && userData.user_id) handleActionClick(action, userData);
        }
      };
      tableElement.addEventListener("click", listener);
      return () => tableElement.removeEventListener("click", listener);
    }
  }, []);

  const ajaxConfig = {
    url: `${API_BASE_URL}/api/admin/users`,
    dataSrc: "",
    headers: { "x-auth-token": localStorage.getItem("authToken") || "" },
  };

  const tableColumns = [
    { title: "User ID", data: "user_id" },
    { title: "First Name", data: "first_name" },
    { title: "Last Name", data: "last_name" },
    { title: "Username", data: "user_name" },
    { title: "Email", data: "email" },
    { title: "Role", data: "role" },
    {
      title: "Actions",
      data: null,
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: any) => {
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-400 group-hover:text-blue-200"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-red-500 group-hover:text-red-300"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.742.742H5.654a.75.75 0 01-.742-.742L3.91 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /><path d="M18 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.5 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM6 10.5a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>`;
        return `<div class="flex items-center justify-center space-x-4">
            <button title="Edit User" data-action="edit" data-user='${JSON.stringify(row)}' class="group p-2 rounded-full hover:bg-blue-500/20 transition-colors">${editIcon}</button>
            <button title="Delete User" data-action="delete" data-user='${JSON.stringify(row)}' class="group p-2 rounded-full hover:bg-red-500/20 transition-colors">${deleteIcon}</button>
        </div>`;
      },
    },
  ];

  return (
    <>
      {alert?.show && <AlertNotification {...alert} onClose={() => setAlert(null)} />}
      
      {isAddModalOpen && (
        <CreateUserForm
          onClose={() => setAddModalOpen(false)}
          onSuccess={(formData: any) => {
              setAddModalOpen(false);
              setConfirmingAction({ type: 'add', data: formData });
          }}
        />
      )}

      {editData && (
        <EditUserModal 
            user={editData} 
            onClose={() => setEditData(null)} 
            onSuccess={(formData: any) => {
                setEditData(null);
                setConfirmingAction({ type: 'edit', data: { ...editData, formData } });
            }}
        />
      )}

      {confirmingAction && (
        <PasswordConfirmationModal
            actionTitle={`${confirmingAction.type.charAt(0).toUpperCase() + confirmingAction.type.slice(1)} User`}
            onClose={closeAllModals}
            onConfirm={performActionAfterVerification}
            loading={isVerifying}
            error={passwordError}
        />
      )}

      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#c69909]">User Management</h1>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
        <DataTable
          id="userTable"
          ref={tableRef}
          className="display w-full"
          ajax={ajaxConfig}
          columns={tableColumns}
        />
      </div>
    </>
  );
}