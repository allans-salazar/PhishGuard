import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { login, register, loadToken, logout } from "../src/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("trainer@example.com");
  const [password, setPassword] = useState("test1234");
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER">("PROVIDER");

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Auth</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="email" autoCapitalize="none"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="password" secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="PROVIDER" onPress={() => setRole("PROVIDER")} />
        <Button title="CUSTOMER" onPress={() => setRole("CUSTOMER")} />
      </View>
      <Button title="Register" onPress={async () => {
        try { await register(email, password, role); Alert.alert("Registered"); }
        catch (e:any){ Alert.alert("Register failed", e?.response?.data?.detail || e.message); }
      }} />
      <Button title="Login" onPress={async () => {
        try { await login(email, password); Alert.alert("Logged in"); }
        catch (e:any){ Alert.alert("Login failed", e?.response?.data?.detail || e.message); }
      }} />
      <Button title="Show Token" onPress={async () => {
        const t = await loadToken(); Alert.alert("Token", t ? t.slice(0,24)+"..." : "(none)");
      }} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}