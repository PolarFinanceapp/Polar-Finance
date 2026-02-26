import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Transaction {
  name: string;
  amount: number;
  cat: string;
  type: 'expense' | 'income';
  icon: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (transactions: Transaction[]) => void;
}

const CAT_ICONS: Record<string, string> = {
  'Housing':'🏠','Groceries':'🛒','Transport':'🚗','Entertainment':'🎬',
  'Health':'💊','Clothing':'👗','Utilities':'⚡','Subscriptions':'📱',
  'Food':'🍕','Income':'💼','Savings':'💰','Shopping':'📦','Other':'🎁',
};

export default function ReceiptScanner({ visible, onClose, onAdd }: Props) {
  const { theme: c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [results, setResults]       = useState<Transaction[]>([]);
  const [selected, setSelected]     = useState<number[]>([]);
  const [autoMode, setAutoMode]     = useState(true);
  const [capturing, setCapturing]   = useState(false);
  const [countdown, setCountdown]   = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setImage(null); setLoading(false); setError(null);
    setResults([]); setSelected([]); setCapturing(false); setCountdown(null);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  };

  const handleClose = () => { reset(); onClose(); };

  // Start auto-capture countdown when camera is ready
  const startAutoCapture = useCallback(() => {
    if (capturing || loading || image) return;
    setCapturing(true);
    setCountdown(3);

    let count = 3;
    countdownTimer.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        capturePhoto();
      }
    }, 1000);
  }, [capturing, loading, image]);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      if (photo?.base64) {
        setImage(photo.uri);
        analyseReceipt(photo.base64);
      }
    } catch (err) {
      setError('Failed to take photo. Please try again.');
      setCapturing(false);
      setCountdown(null);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Photo library permission required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      analyseReceipt(result.assets[0].base64);
    }
  };

  const analyseReceipt = async (base64: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setCapturing(false);
    setCountdown(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              {
                type: 'text',
                text: `You are a receipt and ticket scanner. Look carefully at this image and extract any payment or transaction information.

This could be a receipt, till receipt, bus ticket, train ticket, parking ticket, cinema ticket, invoice, or any other payment document.

Return ONLY a valid JSON array with no markdown, no backticks, no explanation. Just raw JSON like this:
[{"name":"Arriva Bus","amount":2.50,"cat":"Transport","type":"expense","icon":"🚌"}]

Rules:
- name: the merchant, service or description
- amount: a positive number (look for total, fare, price, cost, amount paid)
- cat: must be exactly one of: Housing, Groceries, Transport, Entertainment, Health, Clothing, Utilities, Subscriptions, Food, Income, Savings, Shopping, Other
- type: always "expense" for any purchase or ticket
- icon: a relevant emoji

For transport tickets use cat "Transport" and icons like 🚌 🚂 🚇 🚕 ✈️
For food use cat "Food" and icon 🍕 ☕
For shopping use cat "Shopping" and icon 🛍️
For cinema/events use cat "Entertainment" and icon 🎬

If you can see any price or amount on the image, include it even if the image is blurry.
If you truly cannot find any amount at all, return [].`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: Transaction[] = JSON.parse(clean);

      if (parsed.length === 0) {
        setError('Could not find any transaction amount. Try holding the ticket closer or in better light.');
      } else {
        setResults(parsed);
        setSelected(parsed.map((_: Transaction, i: number) => i));
      }
    } catch (err: any) {
      setError('Failed to analyse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) =>
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const confirmAdd = () => {
    const toAdd = results.filter((_: Transaction, i: number) => selected.includes(i));
    onAdd(toAdd);
    handleClose();
  };

  // Request permission on mount
  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#000' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Scan Receipt 🧾</Text>
            <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>
              {!image && !loading ? 'Hold ticket steady — auto captures in 3s' : loading ? 'Analysing...' : 'Review transactions'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={{ backgroundColor: '#222', borderRadius: 50, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Camera / Image Preview */}
        {!image && !loading && (
          <>
            {permission?.granted ? (
              <View style={{ flex: 1, position: 'relative' }}>
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1 }}
                  facing="back"
                  onCameraReady={startAutoCapture}
                />

                {/* Overlay frame */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: '85%', height: '55%', borderWidth: 2, borderColor: capturing ? '#00D4AA' : '#fff', borderRadius: 12, opacity: 0.8 }} />
                  <Text style={{ color: '#fff', fontSize: 13, marginTop: 12, textAlign: 'center', opacity: 0.8 }}>Align receipt within the frame</Text>
                </View>

                {/* Countdown */}
                {countdown !== null && countdown > 0 && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,212,170,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900' }}>{countdown}</Text>
                    </View>
                  </View>
                )}

                {/* Bottom controls */}
                <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 30 }}>
                  <TouchableOpacity onPress={pickFromGallery} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 14 }}>
                    <Text style={{ fontSize: 24 }}>🖼️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { reset(); startAutoCapture(); }} style={{ backgroundColor: capturing ? '#00D4AA' : 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 14 }}>
                    <Text style={{ fontSize: 24 }}>📷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={capturePhoto} style={{ backgroundColor: '#fff', borderRadius: 50, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: capturing ? '#00D4AA' : '#333' }} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Camera Permission Required</Text>
                <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Please allow camera access to scan receipts</Text>
                <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }} onPress={requestPermission}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 12 }} onPress={pickFromGallery}>
                  <Text style={{ color: '#aaa', fontSize: 14 }}>Or upload from gallery instead</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {image && <Image source={{ uri: image }} style={{ width: '100%', height: 200, opacity: 0.4 }} resizeMode="cover" />}
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#00D4AA" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 16 }}>Reading receipt...</Text>
              <Text style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>Claude AI is extracting transactions</Text>
            </View>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Couldn't read receipt</Text>
            <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 }} onPress={reset}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickFromGallery}>
              <Text style={{ color: '#aaa', fontSize: 14 }}>Upload from gallery instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <View style={{ flex: 1, padding: 20 }}>
            {image && <Image source={{ uri: image }} style={{ width: '100%', height: 120, borderRadius: 12, marginBottom: 16, opacity: 0.7 }} resizeMode="cover" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
              Found {results.length} transaction{results.length > 1 ? 's' : ''}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>Tap to deselect any you don't want</Text>

            {results.map((txn: Transaction, i: number) => {
              const isSel = selected.includes(i);
              return (
                <TouchableOpacity key={i} onPress={() => toggleSelect(i)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSel ? '#1a1a2e' : '#111', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isSel ? c.accent : '#333', opacity: isSel ? 1 : 0.5 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>{txn.icon || CAT_ICONS[txn.cat] || '💳'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{txn.name}</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>{txn.cat}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '700' }}>-£{txn.amount.toFixed(2)}</Text>
                    {isSel && <Text style={{ color: c.accent, fontSize: 10, marginTop: 2 }}>✓ Selected</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#222', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' }} onPress={reset}>
                <Text style={{ color: '#aaa', fontWeight: '700' }}>Scan Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: selected.length === 0 ? 0.4 : 1 }}
                onPress={confirmAdd} disabled={selected.length === 0}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Add {selected.length} Transaction{selected.length !== 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}