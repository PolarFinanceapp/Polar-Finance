import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PolarLogo from '../components/PolarLogo';
import {
  checkRateLimit,
  formatRetryAfter,
  MAX_LENGTHS,
  resetRateLimit,
  sanitiseShort,
  validateEmail,
  validatePassword,
} from '../lib/security';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Inline validation errors
  const [emailErr,    setEmailErr]    = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [nameErr,     setNameErr]     = useState('');

  const validate = (): boolean => {
    let ok = true;
    const ev = validateEmail(email);
    const pv = validatePassword(password);
    setEmailErr(ev.error);
    setPasswordErr(pv.error);
    if (!ev.valid) ok = false;
    if (!pv.valid) ok = false;
    if (mode === 'signup') {
      const trimName = name.trim();
      if (!trimName) { setNameErr('Name is required.'); ok = false; }
      else if (trimName.length < 2) { setNameErr('Name must be at least 2 characters.'); ok = false; }
      else setNameErr('');
    }
    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    // Rate limit: 5 attempts per 15 min
    const rl = await checkRateLimit('login', 5);
    if (!rl.allowed) {
      Alert.alert('Too many attempts', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)} before trying again.`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
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

    // Rate limit: 3 signups per 15 min
    const rl = await checkRateLimit('signup', 3);
    if (!rl.allowed) {
      Alert.alert('Too many attempts', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)} before trying again.`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: sanitiseShort(name, MAX_LENGTHS.name) } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Check your email!',
        'We sent you a confirmation link. Please verify your email then log in.',
        [{ text: 'OK', onPress: () => setMode('login') }],
      );
    }
  };

  const handleForgotPassword = async () => {
    const ev = validateEmail(email);
    if (!ev.valid) { Alert.alert('Enter a valid email first.'); return; }

    const rl = await checkRateLimit('reset', 3, 60 * 60 * 1000); // 3 per hour
    if (!rl.allowed) {
      Alert.alert('Too many requests', `Please wait ${formatRetryAfter(rl.retryAfterSeconds)}.`);
      return;
    }

    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    Alert.alert('Password Reset', 'Check your email for a reset link.');
  };

  const Field = ({ label, value, onChangeText, error, ...rest }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: '#13132A', borderRadius: 16, padding: 16,
          color: '#E8E8F0', fontSize: 15,
          borderWidth: 1, borderColor: error ? '#FF6B6B' : 'rgba(108,99,255,0.2)',
        }}
        value={value}
        onChangeText={(v: string) => { onChangeText(v); }}
        placeholderTextColor="#7B7B9E"
        {...rest}
      />
      {!!error && <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{error}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <PolarLogo size={100} />
          <Text style={{ color: '#E8E8F0', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 }}>Polar Finance</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginTop: 6 }}>Your money, under control</Text>
        </View>

        {/* Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: '#13132A', borderRadius: 50, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}>
          {(['login', 'signup'] as const).map(m => (
            <TouchableOpacity key={m}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: mode === m ? '#6C63FF' : 'transparent' }}
              onPress={() => { setMode(m); setEmailErr(''); setPasswordErr(''); setNameErr(''); }}>
              <Text style={{ color: mode === m ? '#fff' : '#7B7B9E', fontWeight: '700', fontSize: 14 }}>
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        {mode === 'signup' && (
          <Field label="Full Name" value={name} error={nameErr}
            placeholder="James Smith" autoCapitalize="words"
            maxLength={MAX_LENGTHS.name}
            onChangeText={(v: string) => { setName(v); setNameErr(''); }} />
        )}

        <Field label="Email" value={email} error={emailErr}
          placeholder="you@example.com" keyboardType="email-address"
          autoCapitalize="none" autoCorrect={false}
          maxLength={254}
          onChangeText={(v: string) => { setEmail(v); setEmailErr(''); }} />

        {/* Password with toggle */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Password</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A',
            borderRadius: 16, borderWidth: 1, borderColor: passwordErr ? '#FF6B6B' : 'rgba(108,99,255,0.2)',
          }}>
            <TextInput
              style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 15 }}
              placeholder="••••••••" placeholderTextColor="#7B7B9E"
              value={password} onChangeText={v => { setPassword(v); setPasswordErr(''); }}
              secureTextEntry={!showPassword}
              maxLength={128}
              autoCorrect={false} autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {!!passwordErr && <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{passwordErr}</Text>}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={{ backgroundColor: '#6C63FF', borderRadius: 16, padding: 18, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          onPress={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>}
        </TouchableOpacity>

        {/* Forgot password */}
        {mode === 'login' && (
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={handleForgotPassword}>
            <Text style={{ color: '#6C63FF', fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: '#7B7B9E', fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 }}>
          By continuing you agree to our Terms of Service{'\n'}and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}