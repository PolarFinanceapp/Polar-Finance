import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import PolarLogo from '../components/PolarLogo';
import StarBackground from '../components/StarBackground';
import {
  checkRateLimit, formatRetryAfter, MAX_LENGTHS,
  resetRateLimit, sanitiseShort, validateEmail, validatePassword,
} from '../lib/security';
import { supabase } from '../lib/supabase';

// ── Field defined OUTSIDE component to prevent keyboard dismissal ─────────────
type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secure?: boolean;
  onToggleSecure?: () => void;
  [key: string]: any;
};

const Field = ({ label, value, onChangeText, error, secure, onToggleSecure, ...rest }: FieldProps) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#13132A', borderRadius: 16,
      borderWidth: 1, borderColor: error ? '#FF6B6B' : 'rgba(108,99,255,0.2)',
    }}>
      <TextInput
        style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 15 }}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#7B7B9E"
        secureTextEntry={secure}
        autoCorrect={false}
        {...rest}
      />
      {onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure} style={{ paddingHorizontal: 16 }}>
          <Ionicons name={secure ? 'eye-off' : 'eye'} size={18} color="#7B7B9E" />
        </TouchableOpacity>
      )}
    </View>
    {!!error && <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{error}</Text>}
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');

  const resetErrors = () => {
    setNameErr(''); setEmailErr(''); setPasswordErr(''); setConfirmErr('');
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    resetErrors();
    setConfirmPassword('');
  };

  const validate = (): boolean => {
    let ok = true;
    const ev = validateEmail(email);
    const pv = validatePassword(password);
    setEmailErr(ev.error);
    setPasswordErr(pv.error);
    if (!ev.valid) ok = false;
    if (!pv.valid) ok = false;

    if (mode === 'signup') {
      const n = name.trim();
      if (!n) { setNameErr('Name is required.'); ok = false; }
      else if (n.length < 2) { setNameErr('Name must be at least 2 characters.'); ok = false; }
      else setNameErr('');

      if (!confirmPassword) { setConfirmErr('Please confirm your password.'); ok = false; }
      else if (confirmPassword !== password) { setConfirmErr('Passwords do not match.'); ok = false; }
      else setConfirmErr('');
    }
    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const rl = await checkRateLimit('login', 5);
    if (!rl.allowed) {
      Alert.alert('Too many attempts', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)} before trying again.`);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      await resetRateLimit('login');
      const done = await AsyncStorage.getItem('onboarding_complete');
      router.replace(done ? '/(tabs)' as any : '/onboarding' as any);
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const rl = await checkRateLimit('signup', 3);
    if (!rl.allowed) {
      Alert.alert('Too many attempts', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)} before trying again.`);
      return;
    }
    setLoading(true);

    // Sign up — no email confirmation required
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: sanitiseShort(name, MAX_LENGTHS.name) } },
    });

    if (signUpError) {
      setLoading(false);
      Alert.alert('Sign Up Failed', signUpError.message);
      return;
    }

    // Immediately sign in — no confirmation step
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (loginError) {
      Alert.alert('Sign Up Failed', loginError.message);
      return;
    }

    await resetRateLimit('signup');
    router.replace('/onboarding' as any);
  };

  const handleForgotPassword = async () => {
    const ev = validateEmail(email);
    if (!ev.valid) { Alert.alert('Enter a valid email first.'); return; }
    const rl = await checkRateLimit('reset', 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      Alert.alert('Too many requests', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)}.`);
      return;
    }
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    Alert.alert('Password Reset', 'Check your email for a reset link.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0D0D1A' }}
    >
      <StarBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <PolarLogo size={80} />
          <Text style={{ color: '#E8E8F0', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 }}>
            James Finance
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginTop: 6 }}>Your money, under control</Text>
        </View>

        {/* Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: '#13132A', borderRadius: 50, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}>
          {(['login', 'signup'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: mode === m ? '#6C63FF' : 'transparent' }}
              onPress={() => switchMode(m)}>
              <Text style={{ color: mode === m ? '#fff' : '#7B7B9E', fontWeight: '700', fontSize: 14 }}>
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Up fields */}
        {mode === 'signup' && (
          <Field
            label="Full Name"
            value={name}
            error={nameErr}
            placeholder="James Smith"
            autoCapitalize="words"
            maxLength={MAX_LENGTHS.name}
            onChangeText={(v: string) => { setName(v); setNameErr(''); }}
          />
        )}

        <Field
          label="Email"
          value={email}
          error={emailErr}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={254}
          onChangeText={(v: string) => { setEmail(v); setEmailErr(''); }}
        />

        <Field
          label="Password"
          value={password}
          error={passwordErr}
          placeholder="••••••••"
          secure={!showPassword}
          onToggleSecure={() => setShowPassword(p => !p)}
          maxLength={128}
          autoCapitalize="none"
          onChangeText={(v: string) => { setPassword(v); setPasswordErr(''); }}
        />

        {/* Confirm password — only on signup */}
        {mode === 'signup' && (
          <Field
            label="Confirm Password"
            value={confirmPassword}
            error={confirmErr}
            placeholder="••••••••"
            secure={!showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword(p => !p)}
            maxLength={128}
            autoCapitalize="none"
            onChangeText={(v: string) => { setConfirmPassword(v); setConfirmErr(''); }}
          />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={{ backgroundColor: '#6C63FF', borderRadius: 16, padding: 18, alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          onPress={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Text>}
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={handleForgotPassword}>
            <Text style={{ color: '#6C63FF', fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: '#7B7B9E', fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 }}>
          By continuing you agree to our Terms of Service{'\n'}and Privacy Policy
        </Text>

        <Text style={{ color: '#7B7B9E44', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
          © 2026 James Finance
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}