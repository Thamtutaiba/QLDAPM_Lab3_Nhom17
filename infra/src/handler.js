// CommonJS backend: /hello, /classify, /history
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  try {
    const path = event?.rawPath || event?.path || "/";
    const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";

    // /hello (smoke test)
    if (path.endsWith("/hello")) {
      return json(200, { message: "Hello from Lambda!", path: "/hello" });
    }

    // GET /history: scan 20 bản ghi gần nhất
    if (method === "GET" && path.endsWith("/history")) {
      const data = await ddb.scan({
        TableName: TABLE_NAME,
        Limit: 20
      }).promise();

      // Sắp xếp mới nhất trước (nếu có timestamp)
      const items = (data.Items || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return json(200, { items });
    }

    // POST /classify: body = { filename?: string, imageBase64: "..." }
    if (method === "POST" && path.endsWith("/classify")) {
      const body = event.isBase64Encoded
        ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'))
        : JSON.parse(event.body || "{}");

      if (!body.imageBase64) {
        return json(400, { error: "Missing imageBase64" });
      }

      const id = uuidv4();
      const key = `${id}-${body.filename || "upload"}.jpg`;

      // 1) Lưu ảnh vào S3
      const imageBuffer = Buffer.from(body.imageBase64, "base64");
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/jpeg"
      }).promise();

      // 2) Gọi Rekognition
      const rek = await rekognition.detectLabels({
        Image: { S3Object: { Bucket: BUCKET_NAME, Name: key } },
        MaxLabels: 10,
        MinConfidence: 70
      }).promise();

      const labels = (rek.Labels || []).map(l => ({
        Name: l.Name,
        Confidence: l.Confidence
      }));

      // 3) Lưu kết quả vào DynamoDB
      const item = {
        id,
        s3key: key,
        labels,
        createdAt: Date.now()
      };
      await ddb.put({ TableName: TABLE_NAME, Item: item }).promise();

      return json(200, { id, s3key: key, labels });
    }

    return json(404, { error: "Not Found", path, method });
  } catch (e) {
    console.error("Handler error:", e);
    return json(500, { error: "InternalError", detail: e.message });
  }
};
