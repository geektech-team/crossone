import { Component, createApp, h, type VNode } from "transone";
import { createHeading } from "@crossone-app/ui";
import type { HealthResponse } from "@crossone-app/contracts";

interface AppState {
  count: number;
  apiStatus: string;
}

class App extends Component<Record<string, never>, AppState> {
  protected initState(): AppState {
    return { count: 0, apiStatus: "Not checked" };
  }

  protected initStyles(): void {
    this.styleManager.addStyle("app-body", {
      selector: "body",
      properties: {
        margin: 0,
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
      },
    });
    this.styleManager.addStyle("app-shell", {
      selector: ".app-shell",
      properties: {
        maxWidth: "480px",
        margin: "80px auto",
        padding: "24px",
      },
    });
    this.styleManager.addStyle("app-button", {
      selector: "button",
      properties: {
        padding: "10px 16px",
        marginRight: "12px",
        cursor: "pointer",
      },
    });
  }

  protected render(): VNode {
    return h("main", { className: "app-shell" }, [
      createHeading("CrossOne Mobile Web"),
      h("p", {}, ["Your TransOne application is ready."]),
      h("button", {}, ["Count: {{count}}"], { click: () => this.increment() }),
      h("button", {}, ["Check API"], { click: () => this.checkApi() }),
      h("p", {}, ["API: {{apiStatus}}"]),
    ]);
  }

  protected increment(): void {
    this.state.count += 1;
  }

  protected async checkApi(): Promise<void> {
    this.state.apiStatus = "Checking...";
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const health = await response.json() as HealthResponse;
      this.state.apiStatus = health.status === "ok" ? "Connected" : "Unexpected response";
    } catch {
      this.state.apiStatus = "API unavailable";
    }
  }
}

export const app = createApp({
  root: App,
  document: { lang: "en", title: "CrossOne Mobile Web" },
});
app.mount();
