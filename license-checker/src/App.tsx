import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import axios from "axios";
import "./App.css";

interface MachineInfo {
  cpu_brand: string;
  mac_address: string;
}

type Status = "idle" | "fetching" | "ready"  | "adding" | "success" | "error";

function App() {
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const getDetails = async () => {
      setStatus("fetching");
      try {
        const info = await invoke<MachineInfo>("get_machine_details");
        setMachineInfo(info);
        setStatus("ready");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(String(error));
        console.error("Failed to get machine details from Rust:", error);
      }
    };

    getDetails();
  }, []);

  const addCurrentMachine = async () => {
    if (!machineInfo) {
      setErrorMessage("Machine details are not available.");
      setStatus("error");
      return;
    }

    setStatus("adding");
    setErrorMessage("");
    try {
      const backendUrl = "https://goldfinancemanagement.onrender.com/api/machines";
      
      await axios.post(backendUrl, {
        cpu_serial: machineInfo.cpu_brand,
        mac_address: machineInfo.mac_address,
      });
      
      setStatus("success");

    } catch (error: any) {
      setStatus("error");
      setErrorMessage(axios.isAxiosError(error) ? error.response?.data?.message || error.message : String(error));
    }
  };

  const getStatusContent = () => {
    switch(status) {
        case 'idle': return <p>Initializing...</p>;
        case 'fetching': return <p>Getting machine details...</p>;
        case 'adding': return <p>Adding machine to the allowed list...</p>;
        case 'success': return <p className="text-green-400">✅ Machine successfully added to the allowed list!</p>;
        case 'error': return <p className="text-red-400">⚠️ Error: {errorMessage}</p>;
        case 'ready':
        default:
            return <p>Ready to add this machine.</p>; 
    }
  }

  return (
    <div className="container">
      <h1>Machine Registration Tool</h1>
      
      <div className="card">
        <h2>Current Machine Details</h2>
        <p><strong>CPU:</strong> {machineInfo?.cpu_brand || "Loading..."}</p>
        <p><strong>MAC Address:</strong> {machineInfo?.mac_address || "Loading..."}</p>
      </div>
      
      <div className="card">
        <h2>Actions</h2>

       <div className="action-area">
            <button 
                onClick={addCurrentMachine} 
                className="button-add"
                disabled={status === 'fetching' || status === 'adding' || status === 'success'}
            >
                Add This Machine to Allowed List
            </button>
        </div>
        <div className="status-box">
           {getStatusContent()}
        </div>
      </div>
    </div>
  );
}

export default App;