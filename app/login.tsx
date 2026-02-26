import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PolarLogo from '../components/PolarLogo';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      // Check if they've done onboarding
      const done = await AsyncStorage.getItem('onboarding_complete');
      if (done) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Check your email!',
        'We sent you a confirmation link. Please verify your email then log in.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    }
  };

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
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: mode === 'login' ? '#6C63FF' : 'transparent' }} onPress={() => setMode('login')}>
            <Text style={{ color: mode === 'login' ? '#fff' : '#7B7B9E', fontWeight: '700', fontSize: 14 }}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: mode === 'signup' ? '#6C63FF' : 'transparent' }} onPress={() => setMode('signup')}>
            <Text style={{ color: mode === 'signup' ? '#fff' : '#7B7B9E', fontWeight: '700', fontSize: 14 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        {mode === 'signup' && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Full Name</Text>
            <TextInput
              style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 16, color: '#E8E8F0', fontSize: 15, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}
              placeholder="James Smith"
              placeholderTextColor="#7B7B9E"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Email</Text>
          <TextInput
            style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 16, color: '#E8E8F0', fontSize: 15, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}
            placeholder="you@example.com"
            placeholderTextColor="#7B7B9E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Password</Text>
          <TextInput
            style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 16, color: '#E8E8F0', fontSize: 15, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}
            placeholder="••••••••"
            placeholderTextColor="#7B7B9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={{ backgroundColor: '#6C63FF', borderRadius: 16, padding: 18, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          onPress={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
          }
        </TouchableOpacity>

        {/* Forgot password */}
        {mode === 'login' && (
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={async () => {
            if (!email) { Alert.alert('Enter your email first'); return; }
            await supabase.auth.resetPasswordForEmail(email);
            Alert.alert('Password Reset', 'Check your email for a reset link.');
          }}>
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