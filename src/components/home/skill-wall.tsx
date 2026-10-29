import { WallDrift } from "./wall-drift";

type Item = { name: string; category: string; level: number };

const COLUMNS = 5;
const PER_COLUMN = 6;

/**
 * Skills as tiles on a plane tipped back in 3D. Each column holds a rotated slice of the
 * list, rendered twice so its CSS loop is seamless; neighbouring columns glide in
 * opposite directions at different speeds.
 */
export function SkillWall({ items }: { items: Item[] }) {
  if (items.length < 4) return null;
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    Array.from({ length: PER_COLUMN }, (_, k) => items[(c * 3 + k) % items.length]),
  );

  return (
    <section aria-labelledby="stack-title" className="relative z-10 overflow-hidden">
      <h2 id="stack-title" className="sr-only">
        Technologies I work with
      </h2>
      <ul className="sr-only">
        {items.map((s) => (
          <li key={s.name}>
            {s.name} ({s.category})
          </li>
        ))}
      </ul>

      <div aria-hidden className="wall-stage">
        <WallDrift>
          <div className="wall-plane">
            {columns.map((col, c) => (
              <div key={c} className="wall-column">
                <div
                  className="wall-track"
                  style={{ "--duration": `${38 + c * 7}s`, animationDirection: c % 2 ? "reverse" : "normal" } as React.CSSProperties}
                >
                  {[0, 1].map((copy) =>
                    col.map((s, k) => {
                      const lit = (c + k) % 5 === 2;
                      return (
                        <div key={`${copy}-${k}`} className={`wall-tile ${lit ? "wall-tile-lit" : ""}`}>
                          <span className="wall-cat">{s.category}</span>
                          <span className="wall-name">{s.name}</span>
                          <span className="wall-meter">
                            <span style={{ transform: `scaleX(${s.level / 100})` }} />
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            ))}
          </div>
        </WallDrift>
      </div>
    </section>
  );
}
