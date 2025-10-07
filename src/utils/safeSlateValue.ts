export function safeSlateValue(val: string | undefined): string {
  const fallback = [{ type: "paragraph", children: [{ text: "" }] }];
  if (!val) return JSON.stringify(fallback);
  try {
    const parsed = JSON.parse(val);
    if (!Array.isArray(parsed) || parsed.length === 0) return JSON.stringify(fallback);
    const fixed = parsed.map((node: any) => {
      if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
        node.children = [{ text: "" }];
      }
      return node;
    });
    if (fixed.length === 0 || !fixed[0].children || fixed[0].children.length === 0) {
      return JSON.stringify(fallback);
    }
    return JSON.stringify(fixed);
  } catch {
    return JSON.stringify(fallback);
  }
}