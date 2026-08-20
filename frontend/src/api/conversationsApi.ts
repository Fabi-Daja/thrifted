import { axiosInstance } from "./axiosInstance"
import type {
  ChatMessageCreateRequest,
  ChatMessageResponse,
  ConversationCreateRequest,
  ConversationResponse,
} from "@/types"

export const conversationsApi = {
  list: () => axiosInstance.get<ConversationResponse[]>("/conversations").then((r) => r.data),

  create: (data: ConversationCreateRequest) =>
    axiosInstance.post<ConversationResponse>("/conversations", data).then((r) => r.data),

  get: (conversationId: string) =>
    axiosInstance.get<ConversationResponse>(`/conversations/${conversationId}`).then((r) => r.data),

  messages: (conversationId: string) =>
    axiosInstance.get<ChatMessageResponse[]>(`/conversations/${conversationId}/messages`).then((r) => r.data),

  sendMessage: (conversationId: string, data: ChatMessageCreateRequest) =>
    axiosInstance
      .post<ChatMessageResponse>(`/conversations/${conversationId}/messages`, data)
      .then((r) => r.data),
}
