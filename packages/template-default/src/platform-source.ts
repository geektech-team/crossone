import type { ClientDefinition } from "./clients";

// Mini-program and native generators accept different render syntax.
export function platformSource(client: ClientDefinition): string {
  if (client.target.startsWith("mp-")) {
    return `import { Component, createApp, h, type VNode } from "transone";

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
      h("h1", {}, ["${client.title}"]),
      h("p", {}, ["Count: {{count}}"]),
      h("button", {}, ["+1"], { click: () => this.increment() }),
    ]);
  }
}

export const app = createApp({ root: App, document: { lang: "en", title: "${client.title}" } });
app.mount();
`;
  }
  return `import { Component, createApp, type VNode } from "transone";

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
        { tag: "h1", props: { style: { fontSize: 28, color: "#0f172a" } }, children: ["${client.title}"] },
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

export const app = createApp({ root: App, document: { lang: "en", title: "${client.title}" } });
app.mount();
`;
}
