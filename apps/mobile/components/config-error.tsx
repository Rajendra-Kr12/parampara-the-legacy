import { StyleSheet, Text, View } from "react-native";

/**
 * Shown instead of the app when a public value is missing or malformed at build
 * time. The problems name variables only (see lib/public-env.ts), never values.
 */
export function ConfigError({ problems }: { readonly problems: readonly string[] }) {
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Parampara
      </Text>
      <Text accessibilityRole="alert" testID="config-error">
        This build is missing its configuration.
      </Text>
      {problems.map((problem) => (
        <Text key={problem}>{problem}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "600" },
});
