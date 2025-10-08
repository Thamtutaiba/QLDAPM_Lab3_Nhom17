// UploadCard.jsx
import { useState } from "react";
import { classifyImage } from "./api";

export default function UploadCard({ onUploaded }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setPreview(reader.result);
      setLoading(true);
      try {
        const base64 = reader.result.split(",")[1];
        const result = await classifyImage(base64, f.name);
        alert(`Ảnh được phân loại: ${result.labels.map(l => l.Name).join(", ")}`);
        onUploaded && onUploaded();
      } catch (err) {
        alert("Lỗi phân loại: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="upload-card">
      <h2>Tải ảnh lên để phân loại</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {preview && <img src={preview} alt="preview" className="preview" />}
      {loading && <p>Đang xử lý...</p>}
    </div>
  );
}
