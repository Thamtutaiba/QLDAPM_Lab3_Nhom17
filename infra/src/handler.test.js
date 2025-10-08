// handler.test.js
const { handler } = require("./handler");

test("Lambda /hello endpoint", async () => {
  const event = { rawPath: "/hello", requestContext: { http: { method: "GET" } } };
  const result = await handler(event);
  const body = JSON.parse(result.body);
  expect(result.statusCode).toBe(200);
  expect(body.message).toMatch(/Hello/);
});
