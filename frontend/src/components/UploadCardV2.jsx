// UploadCard.jsx - VERSION 2.0 FIXED - 2025-01-09 21:15:00
import { useState } from "react";
import { classifyImage } from "./api";

export default function UploadCard({ onUploaded }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Force new hash - timestamp: 2025-01-09-21-16-00

  const handleFileChange = async (e) => {
    console.log("=== handleFileChange START V2.0 ===");
    const f = e.target.files[0];
    console.log("Selected file:", f, typeof f);
    if (!f) return;

    setLoading(true);
    
    try {
      console.log("Starting FileReader V2.0...");
      // Sử dụng Promise để xử lý FileReader
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log("FileReader onload - result:", reader.result, typeof reader.result);
          resolve(reader.result);
        };
        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          reject(new Error("Lỗi đọc file"));
        };
        console.log("Calling reader.readAsDataURL...");
        reader.readAsDataURL(f);
      });
      
      console.log("Promise resolved - Final dataUrl:", dataUrl, typeof dataUrl);
      
      if (!dataUrl || typeof dataUrl !== 'string') {
        console.error("Invalid dataUrl:", dataUrl, typeof dataUrl);
        alert("Lỗi đọc file ảnh: " + (dataUrl ? typeof dataUrl : 'null/undefined'));
        return;
      }
      
      setPreview(dataUrl);
      
      // Gọi classifyImage với dataUrl string
      console.log("About to call classifyImage with string:", dataUrl.substring(0, 50) + "...");
      const result = await classifyImage(dataUrl, f.name);
      alert(`Ảnh được phân loại: ${result.labels.map(l => l.name || l.Name).join(", ")}`);
      onUploaded && onUploaded();
      
    } catch (err) {
      console.error("handleFileChange Error:", err);
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
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
