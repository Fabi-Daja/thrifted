import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { conversationsApi } from "@/api/conversationsApi"

export const conversationKeys = {
  list: ["conversations"] as const,
  detail: (id: string) => ["conversations", id] as const,
  messages: (id: string) => ["conversations", id, "messages"] as const,
}

export function useConversations(enabled: boolean) {
  return useQuery({
    queryKey: conversationKeys.list,
    queryFn: () => conversationsApi.list(),
    enabled,
  })
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ""),
    queryFn: () => conversationsApi.get(conversationId as string),
    enabled: !!conversationId,
  })
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId ?? ""),
    queryFn: () => conversationsApi.messages(conversationId as string),
    enabled: !!conversationId,
  })
}

export function useStartConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => conversationsApi.create({ product_id: productId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: conversationKeys.list }),
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => conversationsApi.sendMessage(conversationId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) })
      qc.invalidateQueries({ queryKey: conversationKeys.list })
    },
  })
}
