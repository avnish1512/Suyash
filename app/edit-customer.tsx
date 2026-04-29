import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Save, User } from 'lucide-react-native';
import { updateCustomer, getCustomerById } from '../lib/database';
import { showAlert } from '../lib/alert';

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await getCustomerById(id!);
        setName(c.name);
        setPhone(c.phone || '');
        setAddress(c.address || '');
      } catch {
        showAlert('Error', 'Failed to load customer');
        router.back();
      } finally {
        setPageLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) return showAlert('Error', 'Customer name is required');
    setLoading(true);
    try {
      await updateCustomer(id!, {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      showAlert('Success', 'Customer updated!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <View style={s.iconHeader}>
          <View style={s.iconBox}>
            <User color="#0ea5e9" size={32} />
          </View>
          <Text style={s.headerText}>Edit Customer</Text>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Full Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Ramesh Kumar"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., +91 9876543210"
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Address</Text>
          <TextInput
            style={[s.input, { minHeight: 80 }]}
            placeholder="e.g., Main Bazar, City"
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} />
              <Text style={s.btnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  form: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 24 },
  iconBox: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#e0f2fe',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0',
  },
  btn: {
    backgroundColor: '#0ea5e9', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
