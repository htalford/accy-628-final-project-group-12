"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/slideshow/slide-01-interview.png",
    alt: "Talent Quest recruiter meeting with a candidate",
    fit: "cover" as const,
  },
  {
    src: "/slideshow/slide-02-logo.png",
    alt: "TalentQuest logo — Discover. Connect. Succeed.",
    fit: "contain" as const,
  },
  {
    src: "/slideshow/slide-03-handshake.png",
    alt: "Professionals shaking hands after a successful placement",
    fit: "cover" as const,
  },
  {
    src: "/slideshow/slide-04-workplace.png",
    alt: "Talent Quest associates collaborating on the job",
    fit: "cover" as const,
  },
];

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  function goTo(next: number) {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }

  return (
    <div className="relative w-full overflow-hidden border-y border-[var(--ot-border)] bg-white">
      <div className="relative aspect-[21/9] min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[440px]">
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            } ${slide.fit === "contain" ? "bg-white p-8 sm:p-12" : "bg-[var(--ot-navy)]"}`}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={slide.src}
              alt={slideIndex === index ? slide.alt : ""}
              fill
              sizes="100vw"
              className={
                slide.fit === "contain" ? "object-contain" : "object-cover"
              }
              priority={slideIndex === 0}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
        className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--ot-navy)] shadow-sm transition hover:bg-white sm:left-6 sm:p-3"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--ot-navy)] shadow-sm transition hover:bg-white sm:right-6 sm:p-3"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${slideIndex + 1}`}
            onClick={() => goTo(slideIndex)}
            className={`h-2.5 w-2.5 rounded-full transition sm:h-3 sm:w-3 ${
              slideIndex === index
                ? "bg-[var(--ot-ocean)]"
                : "bg-white/80 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
