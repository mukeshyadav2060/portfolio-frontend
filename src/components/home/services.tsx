import type { Service } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { ServiceIndex } from "./service-index";

export function Services({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <section id="services" aria-labelledby="services-title" className="frame section-gap relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitWords as="h2" id="services-title" text="What I do" className="title" />
        <p suppressHydrationWarning data-reveal className="max-w-sm text-lg text-ink-2">
          End to end, so the API and the interface are designed together, not negotiated later.
        </p>
      </div>
      <div className="mt-14 lg:mt-20">
        <ServiceIndex services={services} />
      </div>
    </section>
  );
}
