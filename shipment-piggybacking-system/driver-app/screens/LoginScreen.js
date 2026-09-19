import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import axios from 'axios';

const DEFAULT_API_BASE = 'http://localhost:3000';

export default function LoginScreen({ navigation, route }) {
  const [apiBase, setApiBase] = useState(route.params?.apiBase || DEFAULT_API_BASE);
  const [email, setEmail] = useState('driver@piggyback.internal');
  const [password, setPassword] = useState('driver123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (loginEmail = email, loginPass = password) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${apiBase}/api/auth/login`, {
        email: loginEmail,
        password: loginPass
      });

      if (response.data.success) {
        const { token, user } = response.data;
        // Verify role
        if (user.role !== 'FLEET_DRIVER' && user.role !== 'LOGISTICS_ADMIN' && user.role !== 'DISPATCHER') {
          throw new Error('Access denied: User is not authorized for driver operations.');
        }

        // Navigate to Route Manifest
        navigation.replace('RouteManifest', {
          token,
          user,
          apiBase
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Network error connecting to backend.';
      setErrorMessage(msg);
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      <View style={styles.content}>
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚚</Text>
          </View>
          <Text style={styles.titleText}>SH-205 Driver Companion</Text>
          <Text style={styles.subtitleText}>Linehaul Fleet Logistics & Piggyback Manifest</Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Credentials Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Driver Email / ID</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="driver@piggyback.internal"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>PIN / Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>API Server Endpoint</Text>
          <TextInput
            style={styles.input}
            value={apiBase}
            onChangeText={setApiBase}
            autoCapitalize="none"
            placeholder="http://localhost:3000"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In to Driver Route</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo 1-Tap Login */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => handleLogin('driver@piggyback.internal', 'driver123')}
            disabled={loading}
          >
            <Text style={styles.demoButtonText}>⚡ Quick 1-Tap Fleet Driver Login</Text>
            <Text style={styles.demoSubtext}>Marcus Vance (Linehaul Run 501)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Protected by SHA-256 JWT Handshake & Secure Telemetry Stream
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617'
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  iconText: {
    fontSize: 32
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3
  },
  subtitleText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600'
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  disabledButton: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  demoButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center'
  },
  demoButtonText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700'
  },
  demoSubtext: {
    color: '#fbbf24',
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2
  },
  footerText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 24
  }
});
