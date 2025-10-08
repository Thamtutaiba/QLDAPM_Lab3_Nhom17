// infra/src/handler.js  (CommonJS version for Jest + Lambda)
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({});
const rekognition = new RekognitionClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const BUCKET = process.env.BUCKET_NAME;
const TABLE = process.env.TABLE_NAME;
const ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(body),
  };
}

function toPureBase64(s) {
  if (!s) return "";
  const i = s.indexOf(",");
  return i >= 0 ? s.slice(i + 1) : s;
}
function parseIncomingImage(body) {
  // 1) lấy chuỗi ảnh từ nhiều key khác nhau (phòng khi FE đặt tên khác)
  let s = body?.imageBase64 ?? body?.image ?? body?.data ?? "";

  if (typeof s !== "string" || !s.length) {
    throw new Error("Missing imageBase64");
  }

  // 2) chấp nhận: data:image/<type>;base64,<...>  hoặc chỉ base64 trần
  let mime = body?.mime || "image/jpeg";
  let b64 = s;

  const m = s.match(/^data:(image\/[a-zA-Z0-9.\-+]+);base64,(.+)$/i);
  if (m) {
    mime = m[1];
    b64 = m[2];
  }

  // 3) loại bỏ khoảng trắng / xuống dòng trong base64 (một số browser có thể chèn)
  b64 = b64.replace(/\s/g, "");

  // 4) decode
  const buffer = Buffer.from(b64, "base64");

  // 5) validate “mềm”: đủ lớn để Rekognition xử lý (>= 1 KB)
  if (!buffer || buffer.length < 1024) {
    throw new Error(`Image too small (${buffer.length} bytes)`);
  }

  // 6) chỉ cho phép các định dạng phổ biến
  const ok = /^(image\/(jpeg|jpg|png|webp))$/i.test(mime);
  if (!ok) {
    throw new Error(`Unsupported mime: ${mime}`);
  }

  return { buffer, mime };
}
async function handleClassify(event) {
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  } catch (e) {
    console.error("JSON parse error:", e, "raw body starts:", String(event.body).slice(0, 60));
    return json(400, { error: "BadRequest", detail: "Body must be JSON" });
  }

  try {
    const { buffer, mime } = parseIncomingImage(body);

    console.log("Image received:", { mime, size: buffer.length });

    // --- Upload S3 (nếu bạn đang upload) ---
    const key = `uploads/${Date.now()}_${(body.filename || "image").replace(/[^\w.\-]/g, "_")}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mime
    }));

    // --- Gọi Rekognition ---
    const detect = await rekognition.detectLabels({
      Image: { Bytes: buffer },
      MaxLabels: 10,
      MinConfidence: 70
    });

    return json(200, {
      ok: true,
      labels: (detect.Labels || []).map(l => ({ name: l.Name, confidence: l.Confidence }))
    });

  } catch (e) {
    console.error("Classify error:", e?.message);
    // Trả 400 nếu lỗi dữ liệu người dùng; còn lại 500
    const isUserErr = /Missing imageBase64|Image too small|Unsupported mime|invalid/i.test(e?.message || "");
    return json(isUserErr ? 400 : 500, { error: isUserErr ? "BadRequest" : "InternalError", detail: e.message });
  }
}

async function handleHistory() {
  const res = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 100 }));
  const items = (res.Items || [])
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 20);
  return json(200, { items });
}

async function main(event) {
  const method = (event.requestContext?.http?.method || event.httpMethod || "GET").toUpperCase();
  const path = event.rawPath || event.path || "";

  if (method === "OPTIONS") return { statusCode: 200, headers: corsHeaders, body: "" };

  try {
    if (method === "POST" && path.endsWith("/classify")) return await handleClassify(event);
    if (method === "GET" && path.endsWith("/history")) return await handleHistory();
    if (method === "GET" && (path.endsWith("/hello") || path === "/")) return json(200, { message: "Hello from Lambda" });

    return json(404, { error: "NotFound", path, method });
  } catch (e) {
    console.error("Lambda error:", e);
    return json(500, { error: "InternalError", detail: e.message });
  }
}

module.exports.handler = main;
