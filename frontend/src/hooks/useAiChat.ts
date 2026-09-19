import { useMutation } from "@tanstack/react-query";
import { chatApi } from "@/api/chatApi";
import type { AiChatMessage } from "@/types";

export function useSendAiChatMessage() {
  return useMutation({
    mutationFn: (messages: AiChatMessage[]) => chatApi.send(messages),
  });
}
