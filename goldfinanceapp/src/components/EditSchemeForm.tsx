import React, { useState, useEffect } from "react";
import api from "../api";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";

type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;

interface Slab {
  start_day: string;
  end_day: string;
  interest_rate: string;
}
interface ApiSlab {
  slab_id: number;
  scheme_id: number;
  start_day: number;
  end_day: number;
  interest_rate: string;
}
interface EditSchemeFormProps {
  schemeId: number;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
}
export default function EditSchemeForm({
  schemeId,
  onClose,
  onSuccess,
  setAlert,
}: EditSchemeFormProps) {
  const [formData, setFormData] = useState({
    scheme_name: "",
    description: "",
  });
  const [slabs, setSlabs] = useState<Slab[]>([
    { start_day: "1", end_day: "", interest_rate: "" },
  ]);

  const [slabErrors, setSlabErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemeData = async () => {
      try {
        const response = await api.get(`/api/schemes/${schemeId}`);
        setFormData({
          scheme_name: response.data.scheme_name,
          description: response.data.description || "",
        });
        const fetchedSlabs = response.data.slabs.map((s: ApiSlab) => ({
          start_day: String(s.start_day),
          end_day: String(s.end_day),
          interest_rate: String(s.interest_rate),
        }));
        if (fetchedSlabs.length > 0) {
          setSlabs(fetchedSlabs);
          setSlabErrors(Array(fetchedSlabs.length).fill(""));
        } else {
          setSlabs([{ start_day: "1", end_day: "", interest_rate: "" }]);
          setSlabErrors([""]);
        }
      } catch (error) {
        setAlert({
          show: true,
          type: "error",
          message: "Failed to fetch scheme details.",
        });
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchSchemeData();
  }, [schemeId, setAlert, onClose]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSlabChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    const key = name as keyof Slab;
    let updatedSlabs = [...slabs];

    let sanitizedValue = value;
    if (key === "interest_rate") {
      sanitizedValue = value.match(/^[0-9]*\.?[0-9]{0,2}/)?.[0] || "";
    } else {
      sanitizedValue = value.replace(/[^0-9]/g, "");
    }
    updatedSlabs[index] = { ...updatedSlabs[index], [key]: sanitizedValue };
    setSlabs(updatedSlabs);
  };

  const handleSlabBlur = (
    index: number,
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    const { name } = event.target;
    let updatedSlabs = [...slabs];
    let updatedErrors = [...slabErrors];
    const slab = updatedSlabs[index];
    updatedErrors[index] = "";
    const startDay = parseInt(slab.start_day, 10);
    const endDay = parseInt(slab.end_day, 10);
    if (index === 0 && name === "start_day" && startDay < 1) {
      updatedErrors[0] = "Start Day must be 1 or greater.";
      updatedSlabs[0].start_day = "1";
    }
    if (name === "end_day") {
      if (!isNaN(startDay) && !isNaN(endDay) && endDay <= startDay) {
        updatedErrors[
          index
        ] = `End Day must be greater than Start Day (${startDay}).`;
        updatedSlabs[index].end_day = "";

        for (let i = index + 1; i < updatedSlabs.length; i++) {
          updatedSlabs[i].start_day = "";
        }
      } else {
        for (let i = index + 1; i < updatedSlabs.length; i++) {
          const prevEndDay = parseInt(updatedSlabs[i - 1].end_day, 10);
          updatedSlabs[i].start_day = !isNaN(prevEndDay)
            ? String(prevEndDay + 1)
            : "";
        }
      }
    }
    setSlabs(updatedSlabs);
    setSlabErrors(updatedErrors);
  };

  const addSlabField = () => {
    const lastSlab = slabs[slabs.length - 1];
    if (!lastSlab.start_day || !lastSlab.end_day || !lastSlab.interest_rate) {
      const newErrors = [...slabErrors];
      newErrors[slabs.length - 1] =
        "Please complete this slab before adding another.";
      setSlabErrors(newErrors);
      return;
    }
    const nextStartDay = parseInt(lastSlab.end_day, 10) + 1;
    setSlabs([
      ...slabs,
      { start_day: String(nextStartDay), end_day: "", interest_rate: "" },
    ]);
    setSlabErrors([...slabErrors, ""]);
  };

  const removeSlabField = (index: number) => {
    if (slabs.length <= 1) return;
    let updatedSlabs = [...slabs];
    let updatedErrors = [...slabErrors];
    updatedSlabs.splice(index, 1);
    updatedErrors.splice(index, 1);
    for (let i = index; i < updatedSlabs.length; i++) {
      const prevEndDay = parseInt(updatedSlabs[i - 1].end_day, 10);
      updatedSlabs[i].start_day = !isNaN(prevEndDay)
        ? String(prevEndDay + 1)
        : "";
    }
    setSlabs(updatedSlabs);
    setSlabErrors(updatedErrors);
  };

  const validateSlabs = (): {
    isValid: boolean;
    errorMessage: string | null;
  } => {
    let lastEndDay = 0;

    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      const slabNum = i + 1;

      if (!slab.start_day || !slab.end_day || !slab.interest_rate) {
        return {
          isValid: false,
          errorMessage: `All fields in Slab #${slabNum} are required.`,
        };
      }

      const startDay = parseInt(slab.start_day, 10);
      const endDay = parseInt(slab.end_day, 10);
      const rate = parseFloat(slab.interest_rate);

      if (isNaN(startDay) || isNaN(endDay) || isNaN(rate)) {
        return {
          isValid: false,
          errorMessage: `Invalid number in Slab #${slabNum}.`,
        };
      }

      if (startDay <= 0 || endDay <= 0 || rate <= 0) {
        return {
          isValid: false,
          errorMessage: `Values in Slab #${slabNum} must be positive.`,
        };
      }

      if (endDay <= startDay) {
        return {
          isValid: false,
          errorMessage: `End Day must be greater than Start Day in Slab #${slabNum}.`,
        };
      }

      if (i === 0) {
        if (startDay !== 1) {
          return {
            isValid: false,
            errorMessage: "The first slab must start on Day 1.",
          };
        }
      } else {
        if (startDay !== lastEndDay + 1) {
          return {
            isValid: false,
            errorMessage: `Slab #${slabNum} must start on Day ${
              lastEndDay + 1
            } to be continuous.`,
          };
        }
      }
      lastEndDay = endDay;
    }

    return { isValid: true, errorMessage: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errorMessage } = validateSlabs();
    if (!isValid) {
      setAlert({ show: true, type: "error", message: errorMessage! });
      return;
    }

    setLoading(true);
    const submissionData = { ...formData, slabs };
    try {
      await api.put(`/api/schemes/${schemeId}`, submissionData);
      onSuccess();
    } catch (err: any) {
      setAlert({
        show: true,
        type: "error",
        message: err.response?.data?.message || "Failed to update scheme.",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-transparent focus:outline-none focus:border-[#c69909]";
  const labelStyle = "block text-sm font-bold text-gray-300 mb-1";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
        <p className="text-white">Loading Scheme Details...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">
          Edit Scheme & Interest Slabs
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Scheme Name*</label>
              <input
                type="text"
                name="scheme_name"
                value={formData.scheme_name}
                onChange={handleFormChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className={inputStyle}
                rows={3}
              ></textarea>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-2 border-b border-gray-700 pb-1">
            Interest Rate Slabs
          </h3>
          {slabs.map((slab, index) => (
            <React.Fragment key={index}>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center mb-1">
                <div>
                  <label className="text-xs text-gray-400">Start Day*</label>
                  <input
                    type="text"
                    name="start_day"
                    value={slab.start_day}
                    onChange={(e) => handleSlabChange(index, e)}
                    onBlur={(e) => handleSlabBlur(index, e)}
                    required
                    className={inputStyle}
                    disabled={index > 0}
                    style={
                      index > 0
                        ? { backgroundColor: "#2d3748", cursor: "not-allowed" }
                        : {}
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">End Day*</label>
                  <input
                    type="text"
                    name="end_day"
                    value={slab.end_day}
                    onChange={(e) => handleSlabChange(index, e)}
                    onBlur={(e) => handleSlabBlur(index, e)}
                    required
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Rate (%)*</label>
                  <input
                    type="text"
                    name="interest_rate"
                    value={slab.interest_rate}
                    onChange={(e) => handleSlabChange(index, e)}
                    required
                    className={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSlabField(index)}
                  disabled={slabs.length <= 1}
                  className="p-2 mt-5 text-red-400 hover:text-white rounded-full hover:bg-red-500/20 disabled:opacity-30"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              {slabErrors[index] && (
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center mb-2">
                  <div className="col-span-3 text-right">
                    <p className="text-red-400 text-xs">{slabErrors[index]}</p>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          <button
            type="button"
            onClick={addSlabField}
            className="flex items-center mt-3 text-sm text-[#c69909] font-semibold hover:text-white"
          >
            <PlusIcon className="h-5 w-5 mr-1" /> Add Slab
          </button>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Scheme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
