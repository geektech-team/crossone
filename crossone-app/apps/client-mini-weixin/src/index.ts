import { Component, createApp, h, type VNode } from "transone";

class App extends Component<Record<string, never>, { count: number }> {
  protected initState(): { count: number } {
    return { count: 0 };
  }

  protected initStyles(): void {
    this.styleManager.addStyle("page", {
      selector: ".page",
      properties: { padding: "24px", color: "#0f172a" },
    });
  }

  protected increment(): void {
    this.state.count += 1;
  }

  protected render(): VNode {
    return h("main", { className: "page" }, [
      h("h1", {}, ["CrossOne WeChat"]),
      h("p", {}, ["Count: {{count}}"]),
      h("button", {}, ["+1"], { click: () => this.increment() }),
    ]);
  }
}

export const app = createApp({ root: App, document: { lang: "en", title: "CrossOne WeChat" } });
app.mount();
