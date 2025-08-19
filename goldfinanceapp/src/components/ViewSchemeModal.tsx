import { useState, useEffect } from "react";
import api from "../api";

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="py-2">
    <p className="text-sm text-gray-400 font-medium">{label}</p>
    <p className="text-lg text-white font-semibold break-words">
      {value || "Not Provided"}
    </p>
  </div>
);

interface SchemeData {
    scheme_id: number;
    scheme_name: string;
    description: string;
    created_by: string;
    updated_by: string;
    created_on: string;
    updated_on: string;
    slabs: {
        slab_id: number;
        start_day: number;
        end_day: number;
        interest_rate: string;
    }[];
}

interface ViewSchemeModalProps {
    schemeId: number;
    onClose: () => void;
    setAlert: (alert: any) => void;
}

export default function ViewSchemeModal({ schemeId, onClose, setAlert }: ViewSchemeModalProps) {
    const [schemeData, setSchemeData] = useState<SchemeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchemeData = async () => {
            try {
                const response = await api.get(`/api/schemes/${schemeId}`);
                setSchemeData(response.data);
            } catch (error) {
                setAlert({ show: true, type: 'error', message: 'Failed to fetch scheme details.' });
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchSchemeData();
    }, [schemeId, onClose, setAlert]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold text-[#c69909] mb-6">
                    Scheme Details
                </h2>

                {loading ? (
                    <p className="text-white">Loading details...</p>
                ) : schemeData ? (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
                                Scheme Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                <DetailItem label="Scheme ID" value={schemeData.scheme_id} />
                                <DetailItem label="Scheme Name" value={schemeData.scheme_name} />
                                <div className="md:col-span-2">
                                    <DetailItem label="Description" value={schemeData.description} />
                                </div>
                            </div>
                        </section>
                        
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
                                Interest Rate Slabs
                            </h3>
                            {schemeData.slabs && schemeData.slabs.length > 0 ? (
                                <table className="w-full text-left text-sm mt-2">
                                    <thead className="text-gray-400">
                                        <tr>
                                            <th className="p-2">Days Range</th>
                                            <th className="p-2">Interest Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {schemeData.slabs.map(slab => (
                                            <tr key={slab.slab_id}>
                                                <td className="p-2 text-white font-semibold">Day {slab.start_day} to Day {slab.end_day}</td>
                                                <td className="p-2 text-white">{parseFloat(slab.interest_rate).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500 italic mt-2">No interest rate slabs have been configured for this scheme.</p>
                            )}
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 border-b border-gray-700 pb-1">
                                Audit Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                <DetailItem label="Created By" value={schemeData.created_by} />
                                <DetailItem label="Created On" value={new Date(schemeData.created_on).toLocaleString()} />
                                <DetailItem label="Last Updated By" value={schemeData.updated_by} />
                                <DetailItem label="Last Updated On" value={new Date(schemeData.updated_on).toLocaleString()} />
                            </div>
                        </section>
                    </div>
                ) : (
                    <p className="text-red-400">Could not load scheme data.</p>
                )}
            </div>
        </div>
    );
}