import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Tag, X } from "lucide-react";
import { useSendAiChatMessage } from "@/hooks/useAiChat";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";
import { cn } from "@/lib/utils";
import { ChatProductCard } from "./ChatProductCard";
import type { AiChatMessage, AiChatProductCard } from "@/types";

// §5.1 (faza-5-ai-features.md) - widget global i AI chat assistant-it
// (POST /chat), montuar nje here ne routes/__root.tsx. Endpoint-i eshte
// stateless nga ana e backend-it (s'ruan biseden mes kerkesave) - historia
// mbahet vetem ketu, ne state te komponentit, per sa kohe app-i mbetet i
// hapur (rifreskimi i faqes e fshin, s'ka nevoje per persistence per MVP).
interface DisplayMessage extends AiChatMessage {
  products?: AiChatProductCard[];
  isError?: boolean;
}

const GREETING =
  "Përshëndetje! Jam Thrifty, asistenti AI i Thrifted. Të ndihmoj të gjesh një produkt, të vlerësoj çmimin e diçkaje, ose çdo pyetje tjetër rreth platformës.";

const SUGGESTIONS = [
  "Gjej një xhaketë prej xhins",
  "Sa vlen një bluzë Zara e përdorur?",
  "Si funksionon blerja e sigurt?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [text, setText] = useState("");
  const [invite, setInvite] = useState(true);
  const { notify } = useToast();
  const send = useSendAiChatMessage();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, send.isPending]);

  // Nje ftese e vetme, e qete (pulsim rreth butonit) qe zhduket vetvetiu -
  // jo nje animacion i perhershem qe bezdis nese useri s'ka ende ndersvepruar.
  useEffect(() => {
    const timer = setTimeout(() => setInvite(false), 3400);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || send.isPending) return;

    const userMessage: DisplayMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setText("");

    send.mutate(
      history.map(({ role, content }) => ({ role, content })),
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, products: data.products },
          ]);
        },
        onError: (err) => {
          const message = extractApiError(err, "Thrifty s'po përgjigjet dot tani. Provo përsëri.");
          notify(message, "error");
          setMessages((prev) => [...prev, { role: "assistant", content: message, isError: true }]);
        },
      },
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(text);
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Thrifty"
          className="animate-chat-pop fixed inset-x-4 bottom-24 z-40 flex h-[min(560px,calc(100vh-8rem))] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-cardHover sm:inset-x-auto sm:right-6 sm:w-[380px]"
        >
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
            <ThriftyMark />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-display text-base font-semibold text-surface">Thrifty</p>
                <span
                  className="size-1.5 shrink-0 rounded-full bg-success"
                  aria-hidden="true"
                  title="Online"
                />
              </div>
              <p className="truncate text-xs text-surface/80">Kërko produkte, çmime, pyetje</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Mbyll bisedën"
              className="rounded p-1 text-surface/90 transition-colors hover:bg-surface/10 hover:text-surface"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <AssistantBubble content={GREETING} />
              {messages.length === 0 && !send.isPending && (
                <div className="flex flex-wrap gap-1.5 pl-0.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-textPrimary transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <UserBubble key={i} content={m.content} />
                ) : (
                  <AssistantBubble
                    key={i}
                    content={m.content}
                    products={m.products}
                    isError={m.isError}
                  />
                ),
              )}
              {send.isPending && <TypingBubble />}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Shkruaj një mesazh…"
              maxLength={2000}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!text.trim() || send.isPending}
              aria-label="Dërgo"
              className="flex size-9 shrink-0 items-center justify-center rounded bg-primary text-surface transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v);
          setInvite(false);
        }}
        aria-label={open ? "Mbyll Thrifty" : "Hap Thrifty"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-surface shadow-cardHover transition-transform hover:bg-primary-hover hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30",
          !open && invite && "animate-chat-pulse",
        )}
      >
        {open ? <X className="size-6" /> : <Tag className="size-6" strokeWidth={2.25} />}
      </button>
    </>
  );
}

// Shenja e identitetit te Thrifty-t - nje "tag" (etiketa e cmimit), jo nje
// ikone gjenerike "AI sparkle" - ripërdoret te header-i i panelit dhe si
// ikona e butonit floating, per te lidhur agjentin qarte me temen e
// marketplace-it second-hand.
function ThriftyMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface/20 text-surface",
        className,
      )}
      aria-hidden="true"
    >
      <Tag className="size-4" strokeWidth={2.25} />
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm leading-relaxed text-surface">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  products,
  isError,
}: {
  content: string;
  products?: AiChatProductCard[];
  isError?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm leading-relaxed",
          isError
            ? "border-danger/30 bg-danger/5 text-danger"
            : "border-border bg-background text-textPrimary",
        )}
      >
        {content}
      </div>
      {products && products.length > 0 && (
        <div className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {products.map((p) => (
            <ChatProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2.5">
        <span className="size-1.5 animate-bounce rounded-full bg-textSecondary/60 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-textSecondary/60 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-textSecondary/60" />
      </div>
    </div>
  );
}
