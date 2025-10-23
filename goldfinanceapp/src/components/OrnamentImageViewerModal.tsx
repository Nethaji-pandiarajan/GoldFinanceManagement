import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

interface OrnamentImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
  onReupload: () => void;
}

export default function OrnamentImageViewerModal({ imageUrl, onClose, onReupload }: OrnamentImageViewerModalProps) {
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment}>
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1f2628] p-4 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-bold text-white">
                    Image Preview
                  </Dialog.Title>
                  <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <img src={imageUrl} alt="Ornament Preview" className="w-full h-auto max-h-[70vh] rounded-lg object-contain" />

                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={onReupload}
                        className="flex items-center gap-2 rounded-md bg-[#c69909] px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-yellow-500"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Re-upload Image
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}