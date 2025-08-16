import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/auth.styles";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import ThemeSwitcher, { themes } from "../../components/ThemeSwitcher";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("light");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationType, setVerificationType] = useState(""); // "email" or "phone"
  const currentTheme = themes[theme];

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
    } catch (err) {
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
    } catch (err) {
      setError("Invalid code. Please try again.");
    }
  };

  // Handle forgot password
  const onForgotPassword = async () => {
    setForgotError("");
    setForgotSent(false);
    if (!forgotEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: forgotEmail,
      });
      setForgotSent(true);
    } catch (err) {
      setForgotError("Unable to send reset link. Please check your email address.");
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={30}
    >
      <View style={{ ...styles.container, backgroundColor: currentTheme.background }}>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
        <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} />
        <Text style={[styles.title, { color: currentTheme.text }]}>Welcome Back</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
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
              placeholderTextColor="#9A8478"
              onChangeText={setEmailAddress}
            />

            {/* Password field with eye icon inside */}
            <View style={{ position: "relative", width: "100%" }}>
              <TextInput
                style={[
                  styles.input,
                  error && styles.errorInput,
                  { paddingRight: 40 } // space for icon
                ]}
                value={password}
                placeholder="Enter password"
                placeholderTextColor="#9A8478"
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: [{ translateY: -12 }], // Centers the 24px icon vertically
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color="rgba(74, 52, 40, 0.7)"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={onSignInPress}>
              <Text style={styles.buttonText}>Sign In</Text>
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
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}