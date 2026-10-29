import { getPlatformDefinition, Platform } from "transone/platform";

const CLIENT_PLATFORMS = [
  { id: "client-web-phone", label: "手机 Web / Mobile Web", title: "CrossOne Mobile Web", platform: Platform.WebMobile, port: 5173 },
  { id: "client-web-pc", label: "PC Web", title: "CrossOne PC Web", platform: Platform.WebPc, port: 5174 },
  { id: "client-mini-weixin", label: "微信小程序 / WeChat", title: "CrossOne WeChat", platform: Platform.MiniprogramWeixin, port: 5175 },
  { id: "client-mini-alipay", label: "支付宝小程序 / Alipay", title: "CrossOne Alipay", platform: Platform.MiniprogramAlipay, port: 5176 },
  { id: "client-mini-bytedance", label: "抖音小程序 / ByteDance", title: "CrossOne ByteDance", platform: Platform.MiniprogramBytedance, port: 5177 },
  { id: "client-mini-xiaohongshu", label: "小红书小程序 / Xiaohongshu", title: "CrossOne Xiaohongshu", platform: Platform.MiniprogramXiaohongshu, port: 5178 },
  { id: "client-app-ios", label: "iOS App", title: "CrossOne iOS", platform: Platform.AppIos, port: 5179 },
  { id: "client-app-android", label: "Android App", title: "CrossOne Android", platform: Platform.AppAndroid, port: 5180 },
  { id: "client-app-harmony", label: "HarmonyOS App", title: "CrossOne Harmony", platform: Platform.AppHarmony, port: 5181 },
] as const;

// Application platforms share backend generators and output directory names.
export const CLIENT_OPTIONS = CLIENT_PLATFORMS.map((client) => ({
  ...client,
  target: getPlatformDefinition(client.platform).target,
}));

export type ClientDefinition = (typeof CLIENT_OPTIONS)[number];
export type ClientId = ClientDefinition["id"];
export type TemplateOptions = Readonly<{ clients?: readonly ClientId[] }>;
export const DEFAULT_CLIENTS: readonly ClientId[] = ["client-web-phone", "client-web-pc"];

export function normalizeClients(values: readonly string[]): ClientId[] {
  const known = new Set<string>(CLIENT_OPTIONS.map((client) => client.id));
  for (const value of values) {
    if (!known.has(value)) throw new Error(`Unknown client: ${value}`);
  }
  const selected = new Set(values);
  return CLIENT_OPTIONS.filter((client) => selected.has(client.id)).map((client) => client.id);
}

export function selectedClients(options: TemplateOptions = {}): ClientDefinition[] {
  const ids = new Set(normalizeClients(options.clients ?? DEFAULT_CLIENTS));
  return CLIENT_OPTIONS.filter((client) => ids.has(client.id));
}

export function clientPortVariable(client: ClientDefinition): string {
  return client.id.toUpperCase().replace(/-/g, "_") + "_PORT";
}
