import { normalizeListEntry, toRichTextBlocks } from "@/lib/job-content";

export function RichTextContent({
  value,
  paragraphClassName,
  listClassName,
}: {
  value: string;
  paragraphClassName?: string;
  listClassName?: string;
}) {
  const blocks = toRichTextBlocks(value);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={`list-${index}`} className={listClassName ?? "space-y-3 pl-6"}>
            {block.items.map((item) => (
              <li key={item} className="list-disc">
                {normalizeListEntry(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={`paragraph-${index}`} className={paragraphClassName}>
            {block.items[0]}
          </p>
        ),
      )}
    </div>
  );
}
