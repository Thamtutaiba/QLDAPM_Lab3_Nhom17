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
        setHistory(res.items || []);
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
      const res = await classifyImage(file);
      setLabels(res.labels || []);
      const hist = await getHistory();
      setHistory(hist.items || []);
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
              {labels.map((l, i) => (
                <li key={i}>{l.Name} — {l.Confidence?.toFixed(1)}%</li>
              ))}
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
                  <td>{it.s3key}</td>
                  <td>
                    {(it.labels || []).slice(0,3).map(x => x.Name).join(", ")}
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
