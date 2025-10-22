// src/components/AddCustomerForm.tsx
import React, { useState, useEffect } from "react";
import api from "../api";
type AlertState = {
  show: boolean;
  type: "success" | "error" | "alert";
  message: string;
} | null;
type UploadStatus = "idle" | "uploading" | "uploaded";
const bufferToBase64 = (
  buffer: { type: string; data: number[] } | null | undefined
): string | null => {
  if (!buffer || buffer.type !== "Buffer" || !buffer.data) return null;
  const binary = new Uint8Array(buffer.data).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ""
  );
  return `data:image/jpeg;base64,${btoa(binary)}`;
};

const proofOptions = [
  "Aadhaar Card",
  "PAN Card",
  "Driving License",
  "Passport",
  "Voter ID",
  "Ration Card",
  "Birth Certificate",
];
const relationshipOptions = [
  "Spouse",
  "Parent",
  "Guardian",
  "Child",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Friend",
  "Business Partner",
  "Other",
];

type AddCustomerFormProps = {
  mode: "add" | "edit";
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  setAlert: (alert: AlertState) => void;
};

export default function AddCustomerForm({
  mode,
  initialData,
  onClose,
  onSuccess,
  setAlert,
}: AddCustomerFormProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    relationship_type: "",
    related_person_name: "",
    email: "",
    phone: "",
    gender: "",
    description: "",
    address: "",
    government_proof: "",
    proof_id: "",
    date_of_birth: "",
    nominee_name: "",
    nominee_mobile: "",
    nominee_relationship: "",
    nominee_age: "",
    nominee_gender: "",
  });

  const [customerImage, setCustomerImage] = useState<File | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [customerImagePreview, setCustomerImagePreview] = useState<
    string | null
  >(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerImageStatus, setCustomerImageStatus] =
    useState<UploadStatus>("idle");
  const [proofImageStatus, setProofImageStatus] =
    useState<UploadStatus>("idle");
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const {
        customer_name = "",
        relationship_type = "",
        related_person_name = "",
        email = "",
        phone = "",
        gender = "",
        description = "",
        address = "",
        government_proof = "",
        proof_id = "",
        date_of_birth = "",
        nominee_name = "",
        nominee_mobile = "",
        nominee_relationship = "",
        nominee_age = "",
        nominee_gender = "",
      } = initialData;

      setFormData({
        customer_name,
        relationship_type,
        related_person_name,
        email,
        phone,
        gender,
        description,
        address,
        government_proof,
        proof_id,
        date_of_birth: date_of_birth
          ? new Date(date_of_birth).toISOString().split("T")[0]
          : "",
        nominee_name,
        nominee_mobile,
        nominee_relationship,
        nominee_age,
        nominee_gender,
      });

      setCustomerImagePreview(bufferToBase64(initialData.customer_image));
      setProofImagePreview(bufferToBase64(initialData.proof_image));
    }
  }, [mode, initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "nominee_mobile") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const fieldName = e.target.name;
    const setStatus =
      fieldName === "customer_image"
        ? setCustomerImageStatus
        : setProofImageStatus;
    const setImage =
      fieldName === "customer_image" ? setCustomerImage : setProofImage;
    const setPreview =
      fieldName === "customer_image"
        ? setCustomerImagePreview
        : setProofImagePreview;

    setStatus("idle");
    setPreview(null);
    setImage(null);
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setAlert({
        show: true,
        type: "error",
        message: `File size must be 5MB or less.`,
      });
      e.target.value = "";
      return;
    }

    setStatus("uploading");
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setStatus("uploaded");
    };
    reader.readAsDataURL(file);
  };
  const validateForm = async (): Promise<boolean> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address if you choose to provide one.");
      return false;
    }
    const phoneRegex = /^\d{10,13}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Customer phone number must be 10 to 13 digits.");
      return false;
    }
    if (formData.nominee_mobile && !phoneRegex.test(formData.nominee_mobile)) {
      setError("Nominee phone number must be 10 to 13 digits.");
      return false;
    }

    if (formData.phone && formData.nominee_mobile && formData.phone === formData.nominee_mobile) {
      setError("Customer and Nominee mobile numbers cannot be the same.");
      return false;
    }

    if (customerImage && proofImage) {
        if (customerImage.name === proofImage.name && customerImage.size === proofImage.size) {
            setError("Customer Image and Proof Image appear to be the same file. Please ensure they are distinct.");
            return false;
        }
    } else if (mode === "add") {
        if (!customerImage) {
            setError("Customer image is required.");
            return false;
        }
        if (!proofImage) {
            setError("Proof image is required.");
            return false;
        }
    }
    if (!formData.government_proof) {
      setError("Government Proof Type is required.");
      return false;
    }
    if (!formData.proof_id) {
      setError("Proof ID Number is required.");
      return false;
    }
    if (
      formData.date_of_birth &&
      new Date(formData.date_of_birth) > new Date()
    ) {
      setError("Date of Birth cannot be a future date.");
      return false;
    }
    try {
      setLoading(true);
      const customerUuid =
        mode === "edit" ? initialData.customer_uuid : undefined;
      // const emailPayload = { email: formData.email, customerUuid };
      // const emailResponse = await api.post("/api/check-email", emailPayload);
      // if (emailResponse.data.exists) {
      //   setError("This email address is already taken. Please use another.");
      //   setLoading(false);
      //   return false;
      // }
      const phonePayload = { phone: formData.phone, customerUuid };
      const phoneResponse = await api.post("/api/check-phone", phonePayload);
      if (phoneResponse.data.exists) {
        setError("This phone number is already taken. Please use another.");
        setLoading(false);
        return false;
      }
      if (formData.government_proof && formData.proof_id) {
        const proofIdPayload = { 
          government_proof: formData.government_proof, 
          proof_id: formData.proof_id, 
          customerUuid: customerUuid
        };
        const proofIdResponse = await api.post("/api/check-proof-id", proofIdPayload);
        if (proofIdResponse.data.exists) {
          setError(`This ${formData.government_proof} with ID ${formData.proof_id} is already registered for another customer.`);
          setLoading(false);
          return false;
        }
      }
    } catch (err) {
      setError(
        "Could not verify details. Please check connection and try again."
      );
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
    return true;
  };
  const today = new Date().toISOString().split("T")[0];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const isFormValid = await validateForm();
    if (!isFormValid) {
      setLoading(false);
      return;
    }
    const submissionData = new FormData();
    for (const key in formData) {
      submissionData.append(key, formData[key as keyof typeof formData]);
    }
    if (customerImage) submissionData.append("customer_image", customerImage);
    if (proofImage) submissionData.append("proof_image", proofImage);

    if (mode === "edit" && initialData?.nominee_id) {
      submissionData.append("nominee_id", initialData.nominee_id);
    }

    try {
      if (mode === "edit") {
        await api.put(
          `/api/customers/${initialData.customer_uuid}`,
          submissionData
        );
      } else {
        await api.post(`/api/customers`, submissionData);
      }
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${mode} customer.`;
      setError(errorMessage);
      setAlert({ show: true, type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-13 text-white border border-[#1f2628] focus:outline-none focus:border-[#c69909]";
  const fileInputStyle = `${inputStyle} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c69909] file:text-black hover:file:bg-yellow-500 cursor-pointer`;
  const labelStyle = "block text-sm text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-[#111315] rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#c69909] mb-6">
          {mode === "edit" ? "Edit Customer" : "Add New Customer"}
        </h2>
        <form onSubmit={handleSubmit}>
          <section className="border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>Full Name*</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Relationship (e.g., Son of)</label>
                <select
                  name="relationship_type"
                  value={formData.relationship_type}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select if applicable</option>
                  <option value="S/O">Son of (S/O)</option>
                  <option value="D/O">Daughter of (D/O)</option>
                  <option value="W/O">Wife of (W/O)</option>
                  <option value="H/O">Husband of (H/O)</option>
                  <option value="C/O">Care of (C/O)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Related Person Name</label>
                <input
                  type="text"
                  name="related_person_name"
                  value={formData.related_person_name}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Phone*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                  pattern="\d{10,13}"
                  title="Phone number must be 10 to 13 digits."
                />
              </div>
              <div>
                <label className={labelStyle}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={inputStyle}
                  max={today}
                />
              </div>
              <div>
                <label className={labelStyle}>Customer Image</label>
                <input
                  type="file"
                  name="customer_image"
                  onChange={handleFileChange}
                  className={fileInputStyle}
                  accept="image/*"
                  required={mode === "add"}
                />
                {customerImageStatus === "uploading" && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Processing image...
                  </p>
                )}
                {customerImageStatus === "uploaded" && (
                  <p className="text-xs text-green-400 mt-1">Image selected!</p>
                )}
              </div>
              {customerImagePreview && (
                <div className="md:col-span-2">
                  <img
                    src={customerImagePreview}
                    alt="Customer Preview"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="md:col-span-3">
                <label className={labelStyle}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputStyle}
                  rows={2}
                ></textarea>
              </div>
              <div className="md:col-span-3">
                <label className={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={inputStyle}
                  rows={2}
                ></textarea>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Government Proof
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>Proof Type</label>
                <select
                  name="government_proof"
                  value={formData.government_proof}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                >
                  <option value="">Select a Proof Type</option>
                  {proofOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Proof ID Number</label>
                <input
                  type="text"
                  name="proof_id"
                  value={formData.proof_id}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Proof Image</label>
                <input
                  type="file"
                  name="proof_image"
                  onChange={handleFileChange}
                  className={fileInputStyle}
                  accept="image/*"
                  required={mode === "add"}
                />
                {proofImageStatus === "uploading" && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Processing image...
                  </p>
                )}
                {proofImageStatus === "uploaded" && (
                  <p className="text-xs text-green-400 mt-1">Image selected!</p>
                )}
              </div>
              {proofImagePreview && (
                <div className="md:col-span-3">
                  <img
                    src={proofImagePreview}
                    alt="Proof Preview"
                    className="h-32 rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="mb-5">
            <h3 className="text-lg font-semibold text-white mb-">
              Nominee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelStyle}>Nominee Name*</label>
                <input
                  type="text"
                  name="nominee_name"
                  value={formData.nominee_name}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className={labelStyle}>Relationship</label>
                <select
                  name="nominee_relationship"
                  value={formData.nominee_relationship}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select a Relationship</option>
                  {relationshipOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Nominee Mobile</label>
                <input
                  type="tel"
                  name="nominee_mobile"
                  value={formData.nominee_mobile}
                  onChange={handleChange}
                  className={inputStyle}
                  pattern="\d{10,13}"
                  title="Phone number must be 10 to 13 digits."
                />
              </div>
              <div>
                <label className={labelStyle}>Nominee Age</label>
                <input
                  type="number"
                  name="nominee_age"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                  }}
                  value={formData.nominee_age}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Nominee Gender</label>
                <select
                  name="nominee_gender"
                  value={formData.nominee_gender}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>
          {error && (
            <p className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-center">
              {error}
            </p>
          )}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded bg-[#1f2628] hover:bg-black text-white font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-[#c69909] hover:bg-yellow-500 text-black font-semibold"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Customer"
                : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
