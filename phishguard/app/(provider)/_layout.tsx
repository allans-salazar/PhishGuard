import { Stack, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { loadToken, loadRole } from "../../src/api";

export default function ProviderLayout() {
  const [allow, setAllow] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      const r = await loadRole();
      setAllow(!!t && r === "PROVIDER"); // ensure boolean
    })();
  }, []);

  // still loading
  if (allow === null) return null;

  // block access if not provider
  if (!allow) {
    return <Redirect href="/(auth)/login" />;
  }

  // allowed → show provider stack
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#f9f9f9" },
      }}
    />
  );
}