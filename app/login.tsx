import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// If you want actual icons, you'd typically use: import { FontAwesome } from '@expo/vector-icons';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (!username || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // Logic for Google/Apple would go here
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to{"\n"}<Text style={{color: '#e8541a'}}>SIP SAFE</Text></Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.line} />
      </View>

      {/* Social Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity 
          style={[styles.socialButton, styles.googleButton]} 
          onPress={() => handleSocialLogin('Google')}
        >
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.socialButton, styles.appleButton]} 
          onPress={() => handleSocialLogin('Apple')}
        >
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? <Text style={{color: '#e8541a'}}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#111' },
  heading: { fontSize: 40, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 15, marginBottom: 15 },
  button: { backgroundColor: '#e8541a', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Divider Styles
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#666', paddingHorizontal: 10, fontSize: 12, fontWeight: 'bold' },

  // Social Button Styles
  socialContainer: { gap: 12 },
  socialButton: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  googleButton: { backgroundColor: '#fff' }, // Google is usually white or light gray
  appleButton: { backgroundColor: '#fff' },  // Apple is usually black or white depending on theme
  socialButtonText: { color: '#000', fontWeight: 'bold', fontSize: 15 },

  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 }
});