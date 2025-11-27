// app/(provider)/index.tsx
import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function ProviderHome() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Provider Dashboard</Text>

      <Link href="/(provider)/modules" asChild>
        <Button title="View My Modules" />
      </Link>

      <Link href="/(provider)/create" asChild>
        <Button title="Create New Module" />
      </Link>
    </View>
  );
}