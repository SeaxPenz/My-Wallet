import useSafeSignIn from '../../hooks/useSafeSignIn';
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { createAuthStyles } from "../../assets/styles/auth.styles";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSafeSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // forgot password state removed (handled on separate screen)
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationType, setVerificationType] = useState(""); // "email" or "phone"
  const { theme: currentTheme } = useTheme();
  const styles = createAuthStyles(currentTheme);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setError("");
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // Always send code after sign-in attempt
      if (signInAttempt.supportedFirstFactors?.includes("email_code")) {
        await signInAttempt.prepareFirstFactor({ strategy: "email_code" });
        setVerificationType("email");
        setPendingVerification(true);
        return;
      } else if (signInAttempt.supportedFirstFactors?.includes("phone_code")) {
        await signInAttempt.prepareFirstFactor({ strategy: "phone_code" });
        setVerificationType("phone");
        setPendingVerification(true);
        return;
      }

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else if (signInAttempt.status === "needs_second_factor") {
        setError("Further steps required.");
      }
    } catch (_err) {
      setError("Sign in failed. Please try again.");
    }
  };

  // Handle verification code submission
  const onVerifyCode = async () => {
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: verificationType === "email" ? "email_code" : "phone_code",
        code: verificationCode,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Verification failed. Try again.");
      }
    } catch (_err) {
      setError("Invalid code. Please try again.");
    }
  };

  // Forgot password flow is implemented on its own screen; not used here

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={30}
    >
      <View style={{ ...styles.container, backgroundColor: currentTheme.background }}>
  <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} resizeMode="contain" />
        <Text style={[styles.title, { color: currentTheme.text, textAlign: 'center' }]}>Welcome Back</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={currentTheme.expense || currentTheme.primary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={currentTheme.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        {!pendingVerification ? (
          <>
            <TextInput
              style={[styles.input, error && styles.errorInput]}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={currentTheme.textLight}
              keyboardType="email-address"
              autoComplete="email"
              onChangeText={setEmailAddress}
            />

            {/* Password field with eye icon centered vertically */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.inputWithIcon,
                  error && styles.errorInput,
                ]}
                value={password}
                placeholder="Enter password"
                placeholderTextColor={currentTheme.textLight}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.inputIconContainer}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={currentTheme.mode === 'dark' ? '#DDD' : 'rgba(74, 52, 40, 0.7)'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, !isLoaded && { opacity: 0.6 }]}
              onPress={onSignInPress}
              disabled={!isLoaded}
            >
              <Text style={styles.buttonText}>{isLoaded ? 'Sign In' : 'Sign In (disabled)'}</Text>
            </TouchableOpacity>

            {/* Forgot password option */}
            <TouchableOpacity
              style={{ marginTop: 12, marginBottom: 12, alignSelf: "center" }}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={[styles.linkText, { textAlign: "center" }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>

              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text style={{ marginVertical: 16, color: currentTheme.text }}>
              Enter the verification code sent to your {verificationType === "email" ? "email" : "phone"}.
            </Text>
            <TextInput
              style={styles.input}
              value={verificationCode}
              placeholder="Verification code"
              placeholderTextColor="#9A8478"
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.button} onPress={onVerifyCode}>
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 8, alignSelf: 'center' }} onPress={async () => {
              // Allow resending code
              try {
                if (!isLoaded) return;
                const attempt = await signIn.create({ identifier: emailAddress, password });
                if (attempt.supportedFirstFactors?.includes('email_code')) {
                  await attempt.prepareFirstFactor({ strategy: 'email_code' });
                }
              } catch (err) {
                console.warn('Resend failed', err);
              }
            }}>
              <Text style={styles.linkText}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}