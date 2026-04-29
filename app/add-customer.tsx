import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Save, User, Phone, MapPin } from 'lucide-react-native';
import { addCustomer } from '../lib/database';
import { showAlert } from '../lib/alert';

export default function AddCustomerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return showAlert('Error', 'Customer name is required');
    setLoading(true);
    try {
      await addCustomer({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null });
      showAlert('Success', 'Customer added!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { showAlert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <View style={s.iconHeader}>
          <View style={s.iconBox}><User color="#0ea5e9" size={32} /></View>
          <Text style={s.headerText}>New Customer</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Full Name *</Text>
          <TextInput style={s.input} placeholder="e.g., Ramesh Kumar" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} autoFocus />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Phone Number</Text>
          <TextInput style={s.input} placeholder="e.g., +91 9876543210" placeholderTextColor="#94a3b8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Address</Text>
          <TextInput style={[s.input, { minHeight: 80 }]} placeholder="e.g., Main Bazar, City" placeholderTextColor="#94a3b8" value={address} onChangeText={setAddress} multiline />
        </View>
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={20} /><Text style={s.btnText}>Save Customer</Text></>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  btn: { backgroundColor: '#0ea5e9', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
