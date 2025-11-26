import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,   // <-- shows the back button automatically
      }}
    />
  );
}