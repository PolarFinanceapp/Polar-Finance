import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StarBackground from '../components/StarBackground';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot' | 'resetPassword';

const ACCENT = '#6C63FF';

// ── Reusable field ────────────────────────────────────────────────────────────
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
      borderWidth: 1, borderColor: error ? '#FF6B6B' : 'rgba(108,99,255,0.25)',
    }}>
      <TextInput
        style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 15 }}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#4a4a6e"
        secureTextEntry={secure}
        autoCorrect={false}
        autoComplete="off"
        textContentType="oneTimeCode"
        {...rest}
      />
      {onToggleSecure && (
        <TouchableOpacity onPress={onToggleSecure} style={{ paddingHorizontal: 16 }}>
          <Ionicons name={secure ? 'eye-off' : 'eye'} size={18} color="#7B7B9E" />
        </TouchableOpacity>
      )}
    </View>
    {!!error && (
      <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5, marginLeft: 4 }}>{error}</Text>
    )}
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset password flow
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  // Errors
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');

  // ── Listen for password recovery event from email link ────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('resetPassword');
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearErrors = () => {
    setNameErr(''); setEmailErr(''); setPasswordErr(''); setConfirmErr('');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    clearErrors();
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNew('');
  };

  const validateEmail = (e: string): boolean => {
    if (!e.trim()) { setEmailErr('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) {
      setEmailErr('Enter a valid email address.'); return false;
    }
    setEmailErr(''); return true;
  };

  const validatePassword = (p: string): boolean => {
    if (!p) { setPasswordErr('Password is required.'); return false; }
    if (p.length < 6) { setPasswordErr('Password must be at least 6 characters.'); return false; }
    setPasswordErr(''); return true;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearErrors();
    const ev = validateEmail(email);
    const pv = validatePassword(password);
    if (!ev || !pv) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes('invalid login credentials') ||
        error.message.toLowerCase().includes('invalid credentials')) {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email Not Confirmed',
          'Please check your inbox and confirm your email before logging in.',
        );
      } else {
        Alert.alert('Login Failed', error.message);
      }
      return;
    }

    // ── KEY FIX: fetch user and save name to AsyncStorage on every login ──
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name as string | undefined;
        if (name) {
          await AsyncStorage.setItem('jf_user_name', name);
        }
      }
    } catch { }

    setLoading(false);

    // Check if onboarding has been completed
    const done = await AsyncStorage.getItem('onboarding_complete');
    router.replace(done ? '/(tabs)' as any : '/onboarding' as any);
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    clearErrors();
    let ok = true;

    const trimmedName = name.trim();
    if (!trimmedName) { setNameErr('Name is required.'); ok = false; }
    else if (trimmedName.length < 2) { setNameErr('Name must be at least 2 characters.'); ok = false; }

    if (!validateEmail(email)) ok = false;
    if (!validatePassword(password)) ok = false;

    if (!confirmPassword) { setConfirmErr('Please confirm your password.'); ok = false; }
    else if (confirmPassword !== password) { setConfirmErr('Passwords do not match.'); ok = false; }

    if (!ok) return;

    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: trimmedName },
        emailRedirectTo: undefined,
      },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('user already exists')) {
        Alert.alert('Account Exists', 'An account with this email already exists. Try logging in instead.');
      } else {
        Alert.alert('Sign Up Failed', signUpError.message);
      }
      return;
    }

    // Auto sign in after signup
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (loginError) {
      if (loginError.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Almost There',
          'We sent a confirmation email to ' + email.trim().toLowerCase() + '. Please confirm it then come back to log in.',
          [{ text: 'OK', onPress: () => switchMode('login') }],
        );
      } else {
        Alert.alert('Sign Up Failed', loginError.message);
      }
      return;
    }

    // Save name to AsyncStorage so home screen shows it immediately
    await AsyncStorage.setItem('jf_user_name', trimmedName);

    // Always go to onboarding on first signup
    router.replace('/onboarding' as any);
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    clearErrors();
    if (!validateEmail(email)) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'jamesfinance://reset-password' },
    );
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert(
      'Check Your Email',
      `A password reset link has been sent to ${email.trim().toLowerCase()}.`,
      [{ text: 'OK' }],
    );
  };

  // ── Reset Password ────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    let ok = true;
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.'); ok = false;
    }
    if (confirmNew !== newPassword) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both passwords match.'); ok = false;
    }
    if (!ok) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) { Alert.alert('Reset Failed', error.message); return; }

    Alert.alert(
      'Password Updated',
      'Your password has been changed. Please log in.',
      [{ text: 'Log In', onPress: () => switchMode('login') }],
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0D0D1A' }}
    >
      <StarBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingVertical: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: ACCENT + '18',
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: ACCENT + '33',
            marginBottom: 16,
          }}>
            <Ionicons name="bar-chart" size={40} color={ACCENT} />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
            James Finance
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, marginTop: 6 }}>
            {mode === 'forgot' ? 'Reset your password'
              : mode === 'resetPassword' ? 'Set a new password'
                : mode === 'signup' ? 'Create your account'
                  : 'Welcome back'}
          </Text>
        </View>

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <>
            <View style={{ backgroundColor: ACCENT + '11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ACCENT + '33', marginBottom: 24 }}>
              <Text style={{ color: '#9090C0', fontSize: 13, lineHeight: 20 }}>
                Enter your email and we will send you a link to reset your password.
              </Text>
            </View>
            <Field
              label="Email"
              value={email}
              error={emailErr}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(v: string) => { setEmail(v); setEmailErr(''); }}
            />
            <TouchableOpacity
              style={{ backgroundColor: ACCENT, borderRadius: 16, padding: 18, alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 4 }}
              onPress={handleForgotPassword}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Send Reset Link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={() => switchMode('login')}>
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Back to Log In</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── RESET PASSWORD ── */}
        {mode === 'resetPassword' && (
          <>
            <View style={{ backgroundColor: '#00D4AA11', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#00D4AA33', marginBottom: 24 }}>
              <Text style={{ color: '#00D4AA', fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
                Enter and confirm your new password below.
              </Text>
            </View>
            <Field
              label="New Password"
              value={newPassword}
              placeholder="At least 6 characters"
              secure={!showNew}
              onToggleSecure={() => setShowNew(p => !p)}
              autoCapitalize="none"
              onChangeText={(v: string) => setNewPassword(v)}
            />
            <Field
              label="Confirm New Password"
              value={confirmNew}
              placeholder="Repeat your password"
              secure={!showConfirmNew}
              onToggleSecure={() => setShowConfirmNew(p => !p)}
              autoCapitalize="none"
              onChangeText={(v: string) => setConfirmNew(v)}
            />
            <TouchableOpacity
              style={{ backgroundColor: ACCENT, borderRadius: 16, padding: 18, alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 4 }}
              onPress={handleResetPassword}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Update Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── LOGIN / SIGNUP ── */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            {/* Toggle */}
            <View style={{
              flexDirection: 'row', backgroundColor: '#13132A', borderRadius: 50,
              padding: 4, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)',
            }}>
              {(['login', 'signup'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={{
                    flex: 1, paddingVertical: 11, borderRadius: 50, alignItems: 'center',
                    backgroundColor: mode === m ? ACCENT : 'transparent',
                  }}
                  onPress={() => switchMode(m)}>
                  <Text style={{ color: mode === m ? '#fff' : '#7B7B9E', fontWeight: '700', fontSize: 14 }}>
                    {m === 'login' ? 'Log In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name — signup only */}
            {mode === 'signup' && (
              <Field
                label="Full Name"
                value={name}
                error={nameErr}
                placeholder="James Smith"
                autoCapitalize="words"
                maxLength={60}
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
              placeholder="At least 6 characters"
              secure={!showPassword}
              onToggleSecure={() => setShowPassword(p => !p)}
              maxLength={128}
              autoCapitalize="none"
              onChangeText={(v: string) => { setPassword(v); setPasswordErr(''); }}
            />

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <Field
                label="Confirm Password"
                value={confirmPassword}
                error={confirmErr}
                placeholder="Repeat your password"
                secure={!showConfirm}
                onToggleSecure={() => setShowConfirm(p => !p)}
                maxLength={128}
                autoCapitalize="none"
                onChangeText={(v: string) => { setConfirmPassword(v); setConfirmErr(''); }}
              />
            )}

            <TouchableOpacity
              style={{
                backgroundColor: ACCENT, borderRadius: 16, padding: 18,
                alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 6,
              }}
              onPress={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                </Text>}
            </TouchableOpacity>

            {mode === 'login' && (
              <TouchableOpacity style={{ alignItems: 'center', marginTop: 18 }} onPress={() => switchMode('forgot')}>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {mode === 'signup' && (
              <Text style={{ color: '#7B7B9E', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
                After signing up you will be taken through a quick setup to personalise your experience.
              </Text>
            )}
          </>
        )}

        <Text style={{ color: '#7B7B9E44', fontSize: 11, textAlign: 'center', marginTop: 36 }}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
        <Text style={{ color: '#7B7B9E22', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
          © 2026 James Finance
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}