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

async function handleClassify(event) {
  const body = JSON.parse(event.body || "{}");
  let { imageBase64, filename = "upload.jpg" } = body;
  if (!imageBase64) return json(400, { error: "Missing imageBase64" });

  imageBase64 = toPureBase64(imageBase64);
  const buffer = Buffer.from(imageBase64, "base64");

  const id = uuidv4();
  const ext = (filename.split(".").pop() || "jpg").toLowerCase();
  const key = `uploads/${id}.${ext}`;

  // 1) Upload ảnh lên S3
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: ext === "png" ? "image/png" : "image/jpeg",
  }));

  // 2) Gọi Rekognition bằng S3Object
  const rk = await rekognition.send(new DetectLabelsCommand({
    Image: { S3Object: { Bucket: BUCKET, Name: key } },
    MaxLabels: 10,
    MinConfidence: 70,
  }));

  const labels = (rk.Labels || []).map(l => ({ name: l.Name, confidence: l.Confidence }));

  // 3) Lưu DynamoDB
  const item = { id, s3key: key, labels, createdAt: Date.now() };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

  return json(200, item);
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
    if (method === "GET" && (path.endsWith("/hello") || path === "/")) return json(200, { ok: true, msg: "Hello" });

    return json(404, { error: "NotFound", path, method });
  } catch (e) {
    console.error("Lambda error:", e);
    return json(500, { error: "InternalError", detail: e.message });
  }
}

module.exports.handler = main;
