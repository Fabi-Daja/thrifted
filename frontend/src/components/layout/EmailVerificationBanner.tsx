import { useState } from "react";
import { MailWarning } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/api/authApi";
import { extractApiError } from "@/api/axiosInstance";
import { Button } from "@/components/forms/Button";

const RESEND_COOLDOWN_S = 30;

/**
 * Banner që tregon vazhdimisht (jo vetëm në toast-in e gabimit te checkout)
 * se llogaria s'është verifikuar ende — pa këtë, useri kupton vetëm kur
 * i dështon blerja, pa asnjë mënyrë për të ridërguar email-in nga app-i.
 */
export function EmailVerificationBanner() {
  const { user, isLoading } = useAuth();
  const { notify } = useToast();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (isLoading || !user || user.is_email_verified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authApi.resendVerification(user.email);
      notify("Email-i i verifikimit u ridërgua — kontrollo inbox-in.", "success");
      setCooldown(RESEND_COOLDOWN_S);
      const timer = window.setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      notify(extractApiError(e), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-textPrimary">
      <span className="flex items-center gap-2">
        <MailWarning className="size-4 shrink-0 text-danger" aria-hidden="true" />
        Duhet të verifikosh email-in ({user.email}) para se të mund të blesh ose të paguash.
      </span>
      <Button
        variant="outline"
        size="sm"
        loading={sending}
        disabled={cooldown > 0}
        onClick={handleResend}
      >
        {cooldown > 0 ? `Ridërgo (${cooldown}s)` : "Ridërgo email-in"}
      </Button>
    </div>
  );
}
