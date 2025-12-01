import { useState } from "react";
import api from "../api";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";

const SettingsRow = ({ label, onClick, isLoading }: { label: string; onClick: () => void; isLoading: boolean; }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full flex items-center justify-between text-left p-4 bg-[#1f2628] rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-wait transition-colors"
    >
        <span className="font-medium text-white text-lg">{label}</span>
        {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : (
            <ArrowDownTrayIcon className="h-6 w-6 text-gray-400" />
        )}
    </button>
);

export default function SettingsPage() {
  const [loading, setLoading] = useState<"success" | "error" | "">("");
  const [alert, setAlert] = useState<any>(null);

  const handleLogDownload = async (type: "success" | "error") => {
    setLoading(type);
    setAlert(null);
    try {
      const response = await api.get(`/api/logs/download/${type}`, {
        responseType: "arraybuffer",
      });

      const fileName = `${type}-logs-${new Date().toISOString().split("T")[0]}.zip`;
      const filePath = await save({
        title: `Save ${type} Logs`,
        defaultPath: fileName,
        filters: [{ name: "Zip Archive", extensions: ["zip"] }],
      });

      if (filePath) {
        await writeBinaryFile({ path: filePath, contents: response.data });
        setAlert({ show: true, type: 'success', message: 'Log file saved successfully!' });
      }

    } catch (error) {
      console.error("Log download error:", error);
      setAlert({
        show: true,
        type: "error",
        message: "Failed to download logs. The directory may be empty or an error occurred.",
      });
    } finally {
      setLoading("");
    }
  };

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#c69909] mb-4">Settings</h1>
        <hr className="border-gray-700 mb-6" />

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-400 mb-3 px-2">
              LOGS
            </h2>
            <div className="space-y-2">
              <SettingsRow
                label="Success Logs"
                onClick={() => handleLogDownload("success")}
                isLoading={loading === "success"}
              />
              <SettingsRow
                label="Error Logs"
                onClick={() => handleLogDownload("error")}
                isLoading={loading === "error"}
              />
            </div>
          </section>

          {/* You can add more sections here in the future */}
          {/* 
          <section>
            <h2 className="text-lg font-semibold text-gray-400 mb-3 px-2">
              DATA
            </h2>
            <div className="space-y-2">
               <SettingsRow label="Export All Data" onClick={() => {}} isLoading={false} />
            </div>
          </section> 
          */}
        </div>
      </div>
    </>
  );
}