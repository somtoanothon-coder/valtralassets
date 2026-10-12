"use client";

import { useState } from "react";
import clsx from "clsx";
import { FAQS } from "@/lib/content";
import { ChevronDown } from "@/components/ui/icons";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-sub">Got questions? We have answers.</p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div
                  key={faq.question}
                  className={clsx(
                    "overflow-hidden rounded-2xl border transition-colors duration-300",
                    isOpen
                      ? "border-brand-400/30 bg-ink-700/70"
                      : "border-white/[0.07] bg-ink-700/45 hover:border-white/[0.14]",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left sm:px-6"
                    >
                      <span
                        className={clsx(
                          "text-[14.5px] font-semibold transition-colors sm:text-[15.5px]",
                          isOpen ? "text-brand-100" : "text-brand-200/90",
                        )}
                      >
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={clsx(
                          "shrink-0 text-brand-400 transition-transform duration-300",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </h3>
                  <div
                    className={clsx(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[13.5px] leading-[1.8] text-brand-300/80 sm:px-6 sm:pb-6">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Faq;
