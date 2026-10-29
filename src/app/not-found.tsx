import Link from "next/link";

export default function NotFound() {
  return (
    <section className="frame flex min-h-[80vh] flex-col justify-center pt-32">
      <h1 className="display">Lost in space.</h1>
      <p className="lede mt-6 max-w-lg text-ink-2">That page drifted off. Everything else is still where you left it.</p>
      <div className="mt-10">
        <Link href="/" className="btn btn-primary">
          <span>Back home</span>
        </Link>
      </div>
    </section>
  );
}
