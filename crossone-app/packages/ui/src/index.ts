import { h, type VNode } from "transone";

export function createHeading(title: string): VNode {
  return h("h1", {}, [title]);
}
