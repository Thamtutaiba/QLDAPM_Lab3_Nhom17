// frontend/src/api.js - VERSION 2.0 FIXED
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function classifyImage(base64, filename = "upload.jpg") {
  console.log("=== classifyImage DEBUG ===");
  console.log("base64 parameter:", base64);
  console.log("base64 type:", typeof base64);
  console.log("base64 constructor:", base64?.constructor?.name);
  console.log("filename:", filename);
  
  if (typeof base64 === 'object' && base64 !== null) {
    console.log("Object keys:", Object.keys(base64));
    console.log("Object values:", Object.values(base64));
    console.log("Object stringified:", JSON.stringify(base64));
  }
  
  if (!base64 || typeof base64 !== 'string') {
    console.error("❌ Invalid image data - not a string!");
    throw new Error('Invalid image data');
  }
  
  console.log("✅ Valid string data, length:", base64.length);
  
  const res = await fetch(`${API_BASE}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, filename })
  });
  if (!res.ok) throw new Error(`Classify failed: ${res.status}`);
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error(`Fetch history failed: ${res.status}`);
  const data = await res.json();

  // Chuẩn hoá dữ liệu để FE đọc đồng nhất
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
