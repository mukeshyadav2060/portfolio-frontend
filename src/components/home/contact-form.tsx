"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type ContactState } from "@/app/actions";

const BUDGETS = ["Under $2k", "$2k – $5k", "$5k – $15k", "$15k+", "Full-time role"];

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
  state,
  multiline,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  state: ContactState;
  multiline?: boolean;
}) {
  const error = state.status === "error" ? state.fields?.[name]?.[0] : undefined;
  const value = state.status === "error" ? state.values[name] : undefined;
  const common = {
    id: `c-${name}`,
    name,
    required,
    autoComplete,
    defaultValue: value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `c-${name}-err` : undefined,
    placeholder: " ",
    className:
      "peer w-full resize-none bg-transparent pb-3 pt-7 text-xl text-ink outline-none placeholder:text-transparent",
  };
  return (
    <div className="group relative">
      {multiline ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
      <label
        htmlFor={`c-${name}`}
        className="pointer-events-none absolute left-0 top-7 origin-left text-xl text-ink-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:top-0 peer-focus:scale-[0.7] peer-focus:text-ink-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-[0.7]"
      >
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {/* Underline: muted at rest, accent sweeps in on focus. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ink/15" />
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100 ${error ? "scale-x-100 bg-[#ff4d6d]" : "scale-x-0 bg-accent"}`}
      />
      {error && (
        <p id={`c-${name}-err`} className="mt-2 text-sm text-[#ff7a8f]">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, { status: "idle" } as ContactState);
  const success = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "success") success.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={success} tabIndex={-1} role="status" className="fade-up rounded-[28px] bg-accent p-10 text-accent-ink outline-none md:p-14">
        <p className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.035em]">Thanks, {state.name}.</p>
        <p className="mt-5 max-w-md text-lg">Your message is in. I’ll get back to you within two working days.</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-8" noValidate={false}>
      <div className="grid gap-8 md:grid-cols-2">
        <Field name="name" label="Your name" required autoComplete="name" state={state} />
        <Field name="email" label="Email" type="email" required autoComplete="email" state={state} />
      </div>
      <Field name="company" label="Company (optional)" autoComplete="organization" state={state} />

      <fieldset>
        <legend className="text-sm text-ink-2">Budget or engagement</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <label key={b} className="cursor-pointer">
              <input
                type="radio"
                name="budget"
                value={b}
                defaultChecked={state.status === "error" && state.values.budget === b}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full bg-bg-3 px-4 py-2 text-sm text-ink-2 transition-all duration-300 peer-checked:bg-accent peer-checked:text-accent-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:text-ink">
                {b}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field name="message" label="What are you building?" required multiline state={state} />

      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-[#ff7a8f]">
          {state.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn btn-primary h-14 px-8 text-base disabled:opacity-70">
          <span>{pending ? "Sending…" : "Send message"}</span>
          <span aria-hidden className={pending ? "animate-spin" : ""}>
            {pending ? "◌" : "→"}
          </span>
        </button>
      </div>
    </form>
  );
}
