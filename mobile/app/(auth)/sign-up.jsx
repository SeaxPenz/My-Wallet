import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import useSafeSignUp from '../../hooks/useSafeSignUp';
import { useRouter } from "expo-router";
import { createAuthStyles } from "@/assets/styles/auth.styles.js";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTheme } from "../../context/ThemeContext";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSafeSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const styles = createAuthStyles(theme);

  // If Clerk isn't configured in this environment, show a friendly fallback
  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18, marginBottom: 12 }}>Sign-up is disabled in this environment</Text>
        <Text style={{ color: theme.textLight, textAlign: 'center', marginBottom: 12 }}>Set a valid EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in `mobile/.env` to enable sign-up and login flows.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "Sign up failed");
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
  <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Verify your email</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={theme.expense || theme.primary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={theme.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[styles.verificationInput, error && styles.errorInput]}
          value={code}
          placeholder="Enter your six-digit code"
          placeholderTextColor="#9A8478"
          onChangeText={(code) => setCode(code)}
        />

        <TouchableOpacity onPress={onVerifyPress} style={styles.button}>
          <Text style={styles.buttonText}>Verify email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, alignContent: "center", justifyContent: "center" }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
  <Image source={require("../../assets/images/revenue-i2.png")} style={styles.illustration} resizeMode="contain" />

        <Text style={[styles.title, { color: theme.text }]}>Create an account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={theme.expense || theme.primary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={theme.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* First Name and Last Name fields first, styled like email/password */}
        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={firstName}
          placeholder="First Name"
          placeholderTextColor="#9A8478"
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={lastName}
          placeholder="Last Name"
          placeholderTextColor="#9A8478"
          onChangeText={setLastName}
        />

        {/* Email and Password fields after */}
        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          placeholderTextColor="#9A8478"
          onChangeText={setEmailAddress}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.inputWithIcon, error && styles.errorInput]}
            value={password}
            placeholder="Enter password"
            placeholderTextColor="#9A8478"
            secureTextEntry={true}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => {
              // toggle locally
              setPassword((p) => p);
            }}
            style={styles.inputIconContainer}
            accessibilityLabel={'Show password'}
          >
            <Ionicons name="eye-off" size={20} color={theme.mode === 'dark' ? '#DDD' : 'rgba(74, 52, 40, 0.7)'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !isLoaded && { opacity: 0.6 }]}
          onPress={onSignUpPress}
          disabled={!isLoaded}
        >
          <Text style={styles.buttonText}>{isLoaded ? 'Sign Up' : 'Sign Up (disabled)'}</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Do you already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}