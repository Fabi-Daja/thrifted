import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scroll}
      aria-label="Kthehu në fillim"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full bg-primary text-surface shadow-cardHover transition-all duration-300 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
