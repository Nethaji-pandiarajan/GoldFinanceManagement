import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

export default function ImageUploadModal({ isOpen, onClose, onFileUpload }: ImageUploadModalProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
      onClose();
    }
  }, [onFileUpload, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
    multiple: false,
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} /* ... */><div className="fixed inset-0 bg-black/70 backdrop-blur-sm" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child as={Fragment} /* ... */>
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#111315] p-6 align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-[#c69909]">Upload Ornament Image</Dialog.Title>
            <div 
              {...getRootProps()} 
              className={`mt-4 h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors
              ${isDragActive ? 'border-[#c69909] bg-[#c69909]/10' : 'border-gray-600 hover:border-gray-500'}`}
            >
              <input {...getInputProps()} />
              <ArrowUpTrayIcon className={`h-12 w-12 text-gray-500 ${isDragActive ? 'text-[#c69909]' : ''}`} />
              {isDragActive ? 
                <p className="mt-2 text-lg font-semibold text-[#c69909]">Drop the file here ...</p> :
                <p className="mt-2 text-gray-400">Drag & drop an image here, or click to select</p>
              }
            </div>
          </Dialog.Panel>
        </Transition.Child>
        </div></div>
      </Dialog>
    </Transition>
  );
}