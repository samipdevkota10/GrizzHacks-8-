"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Message {
  role: "user" | "vera";
  content: string;
  timestamp: string;
}

export function useAdvisor(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch(`${API_URL}/api/advisor/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            message: text,
            conversation_id: conversationId,
          }),
        });
        const data = await res.json();
        const veraMsg: Message = {
          role: "vera",
          content: data.response ?? "No response from advisor.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, veraMsg]);
        if (data.conversation_id) setConversationId(data.conversation_id);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "vera",
            content: "Sorry, I couldn't connect. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [userId, conversationId]
  );

  return { messages, loading, sendMessage, conversationId };
}
