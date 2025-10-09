import React, { useEffect, useState } from "react";
import { classifyImage, getHistory } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [labels, setLabels] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getHistory();
        setHistory(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const onUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setLabels([]);
    try {
      // Convert file to data URL first
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Lỗi đọc file"));
        reader.readAsDataURL(file);
      });
      
      console.log("App.jsx - dataUrl:", dataUrl, typeof dataUrl);
      const res = await classifyImage(dataUrl, file.name);
      setLabels(res.labels || []);
      const hist = await getHistory();
      setHistory(hist);
    } catch (e) {
      console.error(e);
      setError(e.message || "Upload lỗi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <h1>Lab03 – AWS Rekognition</h1>
      <p className="muted">API: {import.meta.env.VITE_API_BASE || "(chưa cấu hình)"}</p>

      <div className="card">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button disabled={!file || busy} onClick={onUpload}>
          {busy ? "Đang xử lý..." : "Upload & Phân tích"}
        </button>
        {error && <p className="error">{error}</p>}
        {!!labels.length && (
          <div className="labels">
            <h3>Kết quả</h3>
            <ul>
              {labels.map((l, i) => {
                const name = l.name || l.Name || "";
                const conf = (l.confidence ?? l.Confidence);
                return <li key={i}>{name || "—"} — {Number.isFinite(conf) ? conf.toFixed(1) : ""}%</li>;
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Lịch sử gần đây</h3>
        {!history.length && <p className="muted">Chưa có bản ghi</p>}
        {!!history.length && (
          <table>
            <thead>
              <tr><th>id</th><th>file</th><th>labels (top3)</th><th>time</th></tr>
            </thead>
            <tbody>
              {history.map((it) => (
                <tr key={it.id}>
                  <td>{it.id.slice(0,8)}</td>
                  <td>{it.s3key || it.s3Key}</td>
                  <td>
                    {(it.labels || []).slice(0,3).map(x => (x.name || x.Name)).join(", ")}
                  </td>
                  <td>{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
