import { argon2id, hashRaw, Argon2Type, Argon2Error } from '@sonnetstationsolutions/expo-argon2';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const FROZEN = {
  password: 'ABCD2345',
  saltHex: '07070707070707070707070707070707',
  memory: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
  expected: '7d0e2bc7e36bfc948fe53381065a22857b5a4612ef6770ce16719e8f04f8b53d',
};

function utf8Encode(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(++i);
      code = 0x10000 + ((code & 0x3ff) << 10) + (next & 0x3ff);
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

const TYPES: { label: string; value: Argon2Type }[] = [
  { label: 'Argon2id', value: Argon2Type.Argon2id },
  { label: 'Argon2i', value: Argon2Type.Argon2i },
  { label: 'Argon2d', value: Argon2Type.Argon2d },
];

export default function App() {
  const [password, setPassword] = useState(FROZEN.password);
  const [saltHex, setSaltHex] = useState(FROZEN.saltHex);
  const [memory, setMemory] = useState(String(FROZEN.memory));
  const [iterations, setIterations] = useState(String(FROZEN.iterations));
  const [parallelism, setParallelism] = useState(String(FROZEN.parallelism));
  const [hashLength, setHashLength] = useState(String(FROZEN.hashLength));
  const [type, setType] = useState<Argon2Type>(Argon2Type.Argon2id);

  const [running, setRunning] = useState(false);
  const [hex, setHex] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchesFrozen = hex !== null && hex === FROZEN.expected;

  async function run() {
    setRunning(true);
    setError(null);
    setHex(null);
    setElapsedMs(null);
    try {
      const params = {
        password: utf8Encode(password),
        salt: hexToBytes(saltHex),
        memory: parseInt(memory, 10),
        iterations: parseInt(iterations, 10),
        parallelism: parseInt(parallelism, 10),
        hashLength: parseInt(hashLength, 10),
      };
      const start = Date.now();
      const out =
        type === Argon2Type.Argon2id ? await argon2id(params) : await hashRaw({ ...params, type });
      const ms = Date.now() - start;
      setHex(bytesToHex(out));
      setElapsedMs(ms);
    } catch (e) {
      const code = e instanceof Argon2Error ? `[${e.code}] ` : '';
      setError(`${code}${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  function resetToFrozen() {
    setPassword(FROZEN.password);
    setSaltHex(FROZEN.saltHex);
    setMemory(String(FROZEN.memory));
    setIterations(String(FROZEN.iterations));
    setParallelism(String(FROZEN.parallelism));
    setHashLength(String(FROZEN.hashLength));
    setType(Argon2Type.Argon2id);
    setHex(null);
    setElapsedMs(null);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>expo-argon2</Text>
        <Text style={styles.subtle}>Native Argon2 key derivation</Text>

        <Field label="Password (UTF-8)" value={password} onChangeText={setPassword} />
        <Field label="Salt (hex)" value={saltHex} onChangeText={setSaltHex} />
        <View style={styles.row}>
          <Field label="Memory (KiB)" value={memory} onChangeText={setMemory} numeric flex />
          <Field label="Iterations" value={iterations} onChangeText={setIterations} numeric flex />
        </View>
        <View style={styles.row}>
          <Field label="Parallelism" value={parallelism} onChangeText={setParallelism} numeric flex />
          <Field label="Hash length" value={hashLength} onChangeText={setHashLength} numeric flex />
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setType(t.value)}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={run}
          disabled={running}
          style={[styles.runButton, running && styles.runButtonDisabled]}>
          {running ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.runButtonText}>Run</Text>
          )}
        </Pressable>

        <Pressable onPress={resetToFrozen} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset to frozen vector</Text>
        </Pressable>

        {error && (
          <View style={[styles.resultBox, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {hex && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Output ({hex.length / 2} bytes)</Text>
            <Text style={styles.mono} selectable>
              {hex}
            </Text>
            {elapsedMs !== null && <Text style={styles.timing}>{elapsedMs} ms</Text>}
            {matchesFrozen ? (
              <Text style={styles.match}>✓ Matches frozen reference vector</Text>
            ) : (
              <Text style={styles.expected}>
                Frozen vector expects:{'\n'}
                {FROZEN.expected}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  flex?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, props.flex && styles.flex]}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={props.numeric ? 'number-pad' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { padding: 20, paddingBottom: 60 },
  header: { fontSize: 30, fontWeight: '700', color: '#fff', marginTop: 12 },
  subtle: { fontSize: 14, color: '#8a93a6', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, color: '#aab2c5', marginBottom: 6 },
  input: {
    backgroundColor: '#1a1e27',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  typeChip: {
    flex: 1,
    backgroundColor: '#1a1e27',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: '#3b6ef5' },
  typeChipText: { color: '#aab2c5', fontSize: 14, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  runButton: {
    backgroundColor: '#3b6ef5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  runButtonDisabled: { opacity: 0.6 },
  runButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resetButton: { paddingVertical: 14, alignItems: 'center' },
  resetButtonText: { color: '#8a93a6', fontSize: 14 },
  resultBox: { backgroundColor: '#1a1e27', borderRadius: 12, padding: 16, marginTop: 8 },
  resultLabel: { color: '#aab2c5', fontSize: 13, marginBottom: 8 },
  mono: {
    color: '#e6e9f0',
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 18,
  },
  timing: { color: '#8a93a6', fontSize: 13, marginTop: 10 },
  match: { color: '#3ddc84', fontSize: 15, fontWeight: '700', marginTop: 12 },
  expected: { color: '#f5a623', fontSize: 12, fontFamily: 'Courier', marginTop: 12, lineHeight: 16 },
  errorBox: { backgroundColor: '#2a1416' },
  errorText: { color: '#ff6b6b', fontSize: 14 },
});
