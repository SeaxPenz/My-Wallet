import { useSignIn } from "@clerk/clerk-expo";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { createAuthStyles } from "../../assets/styles/auth.styles";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const styles = createAuthStyles(theme);
  const router = useRouter();

  const onSendLink = async () => {
    setError("");
    setSent(false);
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!isLoaded) {
      setError("Please wait, loading...");
      return;
    }
    try {
      await signIn.create({
        strategy: "reset_password_email_link",
        identifier: email,
      });
      setSent(true);
    } catch (err) {
      setError("Unable to send reset link. Please check your email address.");
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}> 
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.primary, fontWeight: "bold" }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} />
      <Text style={[styles.title, { textAlign: "center" }]}>Forgot Password</Text>
      <Text style={[styles.promptText, { textAlign: "center" }]}>
        Enter your registered email to receive a sign-in link.
      </Text>
      <TextInput
        style={[styles.input, error && styles.errorInput, { marginBottom: 8 }]}
        autoCapitalize="none"
        value={email}
        placeholder="Enter your registered email"
        placeholderTextColor="#9A8478"
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={onSendLink}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      {sent && (
        <Text style={{ color: theme.text, marginTop: 8, textAlign: "center" }}>
          A sign-in link has been sent to your email. Click the link in your email to sign in automatically.
        </Text>
      )}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={theme.expense || theme.primary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError("")}>
            <Ionicons name="close" size={20} color={theme.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}
      <TouchableOpacity
        style={{ marginTop: 24, alignSelf: "center" }}
        onPress={() => router.back()}
      >
        <Text style={[styles.linkText, { textAlign: "center" }]}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}