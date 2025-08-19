import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend: () => void;
  loading: boolean;
  error: string | null;
  customerPhone: string;
}

export default function OtpVerificationModal({ isOpen, onClose, onVerify, onResend, loading, error, customerPhone }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState('');

  const handleVerifyClick = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !loading && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#111315] p-6 text-center align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-[#c69909]">
              Enter Verification Code
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-400">
                A 6-digit OTP has been sent to the customer's mobile number ending in ...{customerPhone.slice(-4)}.
              </p>
            </div>

            <div className="mt-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
                className="w-full p-3 text-2xl tracking-[1em] text-center rounded bg-[#1f2628] h-14 text-white border border-gray-600 focus:outline-none focus:border-[#c69909] focus:ring-1 focus:ring-[#c69909]"
                placeholder="------"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-[#c69909] px-4 py-3 text-sm font-bold text-black hover:bg-yellow-500 focus:outline-none disabled:opacity-50"
                onClick={handleVerifyClick}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Submit Loan'}
              </button>
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white"
                onClick={onResend}
                disabled={loading}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
        </div></div>
      </Dialog>
    </Transition>
  );
}