import { expect, test } from "bun:test";
import { Application } from "./app";

test("health module returns the shared API contract without listening", async () => {
  const app = new Application({ port: 0 });
  try {
    await app.initialize();
    expect(app.server.port).toBeNull();
    const response = await app.server.handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ status: "ok", service: "api" });
  } finally {
    await app.stop();
  }
});

test("Application coordinates initialization and repeatable shutdown", async () => {
  const app = new Application({ port: 0 });
  const initializing = app.initialize();
  expect(app.initialize()).toBe(initializing);
  await initializing;
  const stopping = app.stop();
  expect(app.stop()).toBe(stopping);
  await stopping;
  await expect(app.initialize()).rejects.toThrow("Application is closed");
  await expect(app.start()).rejects.toThrow("Application is closed");
});

test("each Application owns an independent server and module graph", async () => {
  const first = new Application({ port: 0 });
  const second = new Application({ port: 0 });
  try {
    expect(first.server).not.toBe(second.server);
    await Promise.all([first.initialize(), second.initialize()]);
    await first.stop();
    const response = await second.server.handle(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "api" });
  } finally {
    await Promise.all([first.stop(), second.stop()]);
  }
});
