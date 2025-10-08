// api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function classifyImage(base64, filename = "upload.jpg") {
  const res = await fetch(`${API_BASE}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, filename })
  });
  if (!res.ok) throw new Error(`Classify failed: ${res.status}`);
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error(`Fetch history failed: ${res.status}`);
  const data = await res.json();

  // Chuẩn hoá trường để FE đọc được đúng
  const items = (data.items || []).map(it => ({
    ...it,
    s3Key: it.s3Key || it.s3key,
    labels: (it.labels || []).map(l => ({
      name: l.name || l.Name,
      confidence: l.confidence ?? l.Confidence
    }))
  }));
  return items;
}
