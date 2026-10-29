import { expect, test } from "bun:test";
import { createApi } from "./app";

test("health endpoint returns the shared API contract", async () => {
  const response = await createApi().handle(new Request("http://localhost/api/health"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", service: "api" });
});
