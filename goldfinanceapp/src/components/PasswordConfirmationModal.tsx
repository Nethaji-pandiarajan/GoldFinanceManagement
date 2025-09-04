import { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";

interface PasswordConfirmationModalProps {
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
  actionTitle: string;
  loading: boolean;
  error: string | null;
}

export default function PasswordConfirmationModal({ onConfirm, onClose, actionTitle, loading, error }: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  const inputStyle = "w-full p-2 rounded bg-[#1f2628] h-12 text-white border border-transparent focus:outline-none focus:border-[#c69909] pl-10";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-2";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-md">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
        <h2 className="text-xl font-bold text-white mb-2">Confirm "{actionTitle}"</h2>
        <p className="text-gray-400 mb-6">To proceed with "{actionTitle}", please enter your password.</p>
        
        <form onSubmit={handleSubmit}>
          <div>
            <label className={labelStyle}>Your Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={inputStyle} 
                required 
                autoFocus
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500" disabled={loading}>Cancel</button>
            <button type="submit" className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading || !password}>
              {loading ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}