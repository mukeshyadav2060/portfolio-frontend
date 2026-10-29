import { SplitWords } from "@/components/motion/split-words";

export function PageHeader({ title, intro, id = "page-title" }: { title: string; intro?: string; id?: string }) {
  return (
    <header className="frame pb-16 pt-40 md:pb-24 md:pt-52">
      <SplitWords as="h1" id={id} text={title} immediate className="display max-w-[14ch]" />
      {intro && (
        <p className="lede fade-up mt-8 max-w-2xl text-ink-2" style={{ "--d": 400 } as React.CSSProperties}>
          {intro}
        </p>
      )}
    </header>
  );
}
