import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/feedback/Modal";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/forms/Button";
import { useSendPhoneCode, useVerifyPhoneCode } from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";

// Shih backend/app/core/sms.py::PHONE_CODE_RESEND_COOLDOWN_SECONDS - vlera
// duhet te mbetet e njejte, por edhe nese backend-i e ndryshon, kjo eshte
// vetem UX proaktiv (numeratori vizual); backend-i mbetet burimi i vertete
// i cooldown-it real (429 nese klienti e anashkalon disi).
const RESEND_COOLDOWN_SECONDS = 60;

interface PhoneVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified?: () => void;
  title?: string;
  description?: string;
}

// Dialog i perbashket per verifikimin e numrit te telefonit (POST
// /users/me/phone/send-code + /verify) - perdoret dy vende: (1) gate-i
// bllokues para wizard-it te shitjes (create-product.tsx, Thrifted-dizajni.pptx
// slide 11), (2) shtim vullnetar te /settings.
export function PhoneVerificationModal({
  open,
  onClose,
  onVerified,
  title = "Verifiko numrin e telefonit",
  description,
}: PhoneVerificationModalProps) {
  const { setUser } = useAuth();
  const { notify } = useToast();
  const sendCode = useSendPhoneCode();
  const verifyCode = useVerifyPhoneCode();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setCode("");
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestCode = (onDone?: () => void) => {
    const trimmed = phone.trim();
    if (!trimmed || sendCode.isPending) return;
    sendCode.mutate(trimmed, {
      onSuccess: (updated) => {
        setUser(updated);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        onDone?.();
      },
      onError: (err) => notify(extractApiError(err), "error"),
    });
  };

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    requestCode(() => {
      setStep("code");
      notify("Kodi u dërgua te numri yt.", "success");
    });
  };

  const resend = () => {
    if (cooldown > 0) return;
    requestCode(() => notify("Kod i ri u dërgua.", "success"));
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4 || verifyCode.isPending) return;
    verifyCode.mutate(code.trim(), {
      // Qëllimisht S'THËRRET onClose() këtu: te gate-i i create-product.tsx,
      // onClose do të thotë "anulo dhe kthehu te ballina" - pas suksesit
      // duam të kundërtën (të vazhdojë te wizard-i). Mjafton setUser() +
      // onVerified(); vetë modal-i zhduket natyrshëm në render-in tjetër
      // kur kushti "user.is_phone_verified" bëhet true (create-product.tsx)
      // ose caller-i e mbyll shprehimisht nga onVerified (settings.tsx).
      onSuccess: (updated) => {
        setUser(updated);
        notify("Numri u verifikua!", "success");
        onVerified?.();
      },
      onError: (err) => notify(extractApiError(err), "error"),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        {description && <p className="text-sm text-textSecondary">{description}</p>}

        {step === "phone" ? (
          <form onSubmit={submitPhone} className="flex flex-col gap-4">
            <TextInput
              label="Numri i telefonit"
              type="tel"
              inputMode="tel"
              placeholder="+355 69 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
            />
            <Button type="submit" loading={sendCode.isPending} disabled={!phone.trim()} fullWidth>
              Dërgo kodin
            </Button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="flex flex-col gap-4">
            <p className="text-sm text-textSecondary">
              Dërguam një kod 6-shifror te{" "}
              <span className="font-medium text-textPrimary">{phone}</span>.
            </p>
            <TextInput
              label="Kodi i verifikimit"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
            <Button type="submit" loading={verifyCode.isPending} disabled={code.trim().length < 4} fullWidth>
              Verifiko
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-textSecondary transition-colors hover:text-textPrimary"
              >
                Ndrysho numrin
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || sendCode.isPending}
                className="text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-textSecondary/60"
              >
                {cooldown > 0 ? `Dërgo kod tjetër (${cooldown}s)` : "Dërgo kod tjetër"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
