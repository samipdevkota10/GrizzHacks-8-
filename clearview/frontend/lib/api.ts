const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getDashboard(userId: string) {
  return fetchAPI(`/api/dashboard/${userId}`);
}

export async function sendChatMessage(userId: string, message: string, conversationId?: string) {
  return fetchAPI("/api/advisor/chat", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, message, conversation_id: conversationId }),
  });
}

export async function purchaseCheck(userId: string, image: File) {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("user_id", userId);
  const res = await fetch(`${API_URL}/api/advisor/purchase-check`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCards(userId: string) {
  return fetchAPI(`/api/cards/${userId}`);
}

export async function destroyCard(cardId: string) {
  return fetchAPI(`/api/cards/${cardId}`, { method: "DELETE" });
}

export async function pauseCard(cardId: string) {
  return fetchAPI(`/api/cards/${cardId}/pause`, { method: "PATCH" });
}

export async function updateCardLimit(cardId: string, limit: number) {
  return fetchAPI(`/api/cards/${cardId}/limit`, {
    method: "PATCH",
    body: JSON.stringify({ spending_limit_monthly: limit }),
  });
}

export async function getAlerts(userId: string) {
  return fetchAPI(`/api/alerts/${userId}`);
}

export async function takeAlertAction(alertId: string, action: string) {
  return fetchAPI(`/api/alerts/${alertId}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function getConversations(userId: string) {
  return fetchAPI(`/api/advisor/conversations/${userId}`);
}

export async function textToSpeech(text: string, userId: string) {
  return fetchAPI("/api/voice/tts", {
    method: "POST",
    body: JSON.stringify({ text, user_id: userId }),
  });
}
