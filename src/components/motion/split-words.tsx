import { Fragment, type ElementType } from "react";

/**
 * Splits text into masked words that rise into place. `immediate` plays on first paint
 * with CSS alone (for the hero); otherwise the words rise when scrolled into view.
 * Splitting by word (never by letter) keeps the text readable to assistive tech.
 */
export function SplitWords({
  text,
  as: Tag = "span",
  className = "",
  immediate = false,
  delay = 0,
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  immediate?: boolean;
  delay?: number;
  id?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    // The reveal observer may mark streamed content before React hydrates it.
    <Tag id={id} suppressHydrationWarning className={`${immediate ? "rise-now" : ""} ${className}`} {...(immediate ? {} : { "data-split": "" })}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="word-mask">
            <span style={{ "--i": i + delay } as React.CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
