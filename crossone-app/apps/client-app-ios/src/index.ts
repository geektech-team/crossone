import { Component, createApp, type VNode } from "transone";

class App extends Component<Record<string, never>, { count: number }> {
  protected initState(): { count: number } {
    return { count: 0 };
  }

  protected initStyles(): void {}

  protected increment(): void {
    this.state.count += 1;
  }

  protected render(): VNode {
    return {
      tag: "main",
      props: { style: { padding: 24, backgroundColor: "#f8fafc" } },
      children: [
        { tag: "h1", props: { style: { fontSize: 28, color: "#0f172a" } }, children: ["CrossOne iOS"] },
        { tag: "text", props: { style: { fontSize: 18, margin: 16 } }, children: ["Count: {{count}}"] },
        {
          tag: "button",
          props: { style: { padding: 12, borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff" } },
          listeners: { click: () => this.increment() },
          children: ["+1"],
        },
      ],
    };
  }
}

export const app = createApp({ root: App, document: { lang: "en", title: "CrossOne iOS" } });
app.mount();
