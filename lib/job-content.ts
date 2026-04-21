function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stripBulletPrefix(value: string) {
  return value.replace(/^\s*(?:[.*•·-]+|\d+[.)])\s*/, "").trim();
}

export function splitContentLines(value: string) {
  return normalizeLineBreaks(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function isBulletLine(value: string) {
  return /^\s*(?:[.*•·-]+|\d+[.)])\s+/.test(value);
}

export function humanizeToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const spaced = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return spaced
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (word.toUpperCase() === word && word.length <= 4) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function normalizeListEntry(value: string) {
  const stripped = stripBulletPrefix(value);
  if (!stripped) {
    return "";
  }

  const compact = stripped
    .replace(/\s*[•·]+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (/^[a-z][A-Za-z0-9_-]*$/.test(compact) && !/\s/.test(compact)) {
    return humanizeToken(compact);
  }

  return compact;
}

export function toRichTextBlocks(value: string) {
  const lines = splitContentLines(value);
  const blocks: Array<{ type: "paragraph" | "list"; items: string[] }> = [];

  for (const line of lines) {
    if (isBulletLine(line)) {
      const item = normalizeListEntry(line);
      if (!item) continue;

      const lastBlock = blocks.at(-1);
      if (lastBlock?.type === "list") {
        lastBlock.items.push(item);
      } else {
        blocks.push({ type: "list", items: [item] });
      }
      continue;
    }

    blocks.push({ type: "paragraph", items: [normalizeListEntry(line)] });
  }

  return blocks;
}
