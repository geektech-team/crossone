import { expect, test } from "bun:test";
import { parseClientSelection, parseInitArguments } from "./init-options";

test("client selection accepts multiple numbers or client identifiers in catalog order", () => {
  expect(parseClientSelection("3,1,3")).toEqual(["client-web-phone", "client-mini-weixin"]);
  expect(parseClientSelection("client-app-ios,client-web-pc")).toEqual(["client-web-pc", "client-app-ios"]);
  expect(parseClientSelection("none")).toEqual([]);
  expect(parseClientSelection("")).toEqual(["client-web-phone", "client-web-pc"]);
  expect(parseClientSelection("all")).toHaveLength(9);
  expect(() => parseClientSelection("10")).toThrow();
  expect(() => parseClientSelection("admin")).toThrow();
});

test("init flags support explicit client choices and default selection without interaction", () => {
  expect(parseInitArguments(["demo", "--clients", "client-web-phone,client-mini-weixin"])).toMatchObject({
    ok: true,
    directory: "demo",
    clients: ["client-web-phone", "client-mini-weixin"],
  });
  expect(parseInitArguments(["--clients=none", "demo"])).toMatchObject({ ok: true, clients: [] });
  expect(parseInitArguments(["demo", "--yes"])).toMatchObject({ ok: true, yes: true });
  for (const args of [["demo", "--clients"], ["demo", "--unknown"], ["demo", "extra"], ["demo", "--clients=admin"]]) {
    expect(parseInitArguments(args).ok).toBe(false);
  }
});
