// src/components/ViewOrnamentModal.tsx

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="py-2">
    <p className="text-sm text-gray-400 font-medium">{label}</p>
    <p className="text-lg text-white font-semibold break-words">
      {value || "N/A"}
    </p>
  </div>
);

export default function ViewOrnamentModal({
  ornament,
  onClose,
}: {
  ornament: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-[#c69909] mb-6">
            Ornament Details
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailItem label="Ornament Name" value={ornament.ornament_name} />
          <DetailItem label="Ornament Type" value={ornament.ornament_type} />
          <DetailItem label="Ornament ID" value={ornament.ornament_id} />
          <DetailItem label="Material Type" value={ornament.material_type} />
          <div className="md:col-span-2">
            <DetailItem label="Description" value={ornament.description} />
          </div>
        </div>
      </div>
    </div>
  );
}
