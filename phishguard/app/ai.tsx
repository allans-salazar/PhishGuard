// app/ai.tsx
import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { askAI } from "../src/api";

type Msg = { id: string; role: "user" | "assistant"; text: string };

export default function AIChat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "sys-hello",
      role: "assistant",
      text: "Hi! I’m your PhishGuard assistant. Ask me about phishing red flags, suspicious links, OTP scams, and more.",
    },
  ]);
  const listRef = useRef<FlatList<Msg>>(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const onAsk = async () => {
    const q = input.trim();
    if (!q || loading) return;

    // optimistic user message
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    scrollToEnd();
    setLoading(true);

    try {
      const res = await askAI(q); // { answer: string }
      const botMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", text: res.answer };
      setMessages((m) => [...m, botMsg]);
      scrollToEnd();
    } catch (e: any) {
      const errMsg: Msg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "Sorry—couldn’t reach the AI right now. Please try again.",
      };
      setMessages((m) => [...m, errMsg]);
      scrollToEnd();
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          backgroundColor: isUser ? "#2563EB" : "#E5E7EB",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 14,
          marginVertical: 6,
          maxWidth: "85%",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 4,
            color: isUser ? "#DBEAFE" : "#111827",
          }}
        >
          {isUser ? "You" : "AI"}
        </Text>
        <Text style={{ color: isUser ? "white" : "#111827", lineHeight: 20 }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>PhishGuard AI</Text>
        <Text style={{ color: "#6B7280", marginTop: 4 }}>Ask about phishing, OTP scams, or suspicious links.</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        onContentSizeChange={scrollToEnd}
      />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          backgroundColor: "white",
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a cybersecurity question…"
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={onAsk}
          returnKeyType="send"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        />
        <TouchableOpacity
          onPress={onAsk}
          disabled={loading || input.trim().length === 0}
          style={{
            backgroundColor: loading || input.trim().length === 0 ? "#A7F3D0" : "#10B981",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          {loading ? <ActivityIndicator /> : <Text style={{ color: "white", fontWeight: "700" }}>Ask</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}