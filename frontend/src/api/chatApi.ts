import { axiosInstance } from "./axiosInstance";
import type { AiChatMessage, AiChatResponse } from "@/types";

// §5.1 (faza-5-ai-features.md) - POST /chat. Auth opsionale (Bearer i
// bashkangjitet automatikisht nga axiosInstance nese useri eshte i loguar);
// endpoint-i eshte stateless - klienti dergon gjithnje historine e plote te
// mesazheve, backend-i s'e ruan asgje mes kerkesave.
export const chatApi = {
  send: (messages: AiChatMessage[]) =>
    axiosInstance.post<AiChatResponse>("/chat", { messages }).then((r) => r.data),
};
