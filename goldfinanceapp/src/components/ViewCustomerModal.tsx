import React from "react";

const bufferToBase64 = (buffer: { type: string; data: number[] }) => {
  if (!buffer || buffer.type !== "Buffer") return null;
  const binary = new Uint8Array(buffer.data).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ""
  );
  return `data:image/jpeg;base64,${btoa(binary)}`;
};

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="py-2">
    <p className="text-sm text-gray-400 font-medium">{label}</p>
    <p className="text-lg text-white font-semibold break-words">
      {value || "N/A"}
    </p>
  </div>
);

export default function ViewCustomerModal({
  customer,
  onClose,
}: {
  customer: any;
  onClose: () => void;
}) {
  const customerImageUrl = bufferToBase64(customer.customer_image);
  const proofImageUrl = bufferToBase64(customer.proof_image);
  const formattedDob = customer.date_of_birth
    ? new Date(customer.date_of_birth).toLocaleDateString()
    : "N/A";
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-[#c69909] mb-6">
            Customer & Nominee Details
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* --- RESTRUCTURED Customer Section --- */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            Customer: {customer.customer_name}
          </h3>
          {/* Using a 2-column grid for a clean, ordered layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DetailItem label="Phone Number" value={customer.phone} />
            <DetailItem label="Email Address" value={customer.email} />
            <DetailItem label="Gender" value={customer.gender} />
            <DetailItem label="Date of Birth" value={formattedDob} />
            <DetailItem label="Customer UUID" value={customer.customer_uuid} />
            <DetailItem label="Description" value={customer.description} />
            {/* Address can span two columns if needed */}
            <div className="md:col-span-2">
              <DetailItem label="Address" value={customer.address} />
            </div>
          </div>
        </section>

        {/* --- RESTRUCTURED Proof Section --- */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            Government Proof
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DetailItem label="Proof Type" value={customer.government_proof} />
            <DetailItem label="Proof ID Number" value={customer.proof_id} />
          </div>
        </section>

        {/* --- RESTRUCTURED Nominee Section --- */}
        <section>
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            Nominee: {customer.nominee_name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DetailItem
              label="Relationship"
              value={customer.nominee_relationship}
            />
            <DetailItem label="Mobile Number" value={customer.nominee_mobile} />
            <DetailItem label="Age" value={customer.nominee_age} />
            <DetailItem label="Gender" value={customer.nominee_gender} />
          </div>
        </section>

        {/* --- RESTRUCTURED Image Display Section --- */}
        <section className="mt-6">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            Uploaded Images
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Customer Image</p>
              {customerImageUrl ? (
                <img
                  src={customerImageUrl}
                  alt="Customer"
                  className="w-full h-auto max-h-80 rounded-lg object-contain bg-black/20"
                />
              ) : (
                <p className="text-gray-500">No image provided.</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Proof Image</p>
              {proofImageUrl ? (
                <img
                  src={proofImageUrl}
                  alt="Proof"
                  className="w-full h-auto max-h-80 rounded-lg object-contain bg-black/20"
                />
              ) : (
                <p className="text-gray-500">No image provided.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
