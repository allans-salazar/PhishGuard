import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function ProviderHome() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 25,
        gap: 25,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Provider Dashboard
      </Text>

      <Link href="/(provider)/modules" asChild>
        <Button title="View My Modules" />
      </Link>

      <Link href="/(provider)/create" asChild>
        <Button title="Create New Module" />
      </Link>
    </View>
  );
}