import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react-native';
import { recordDamaged, getProducts } from '../lib/database';
import { Product } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function AddDamagedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [productId, setProductId] = useState(params.productId || '');
  const [productLabel, setProductLabel] = useState(params.productName || 'Select Product');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  useEffect(() => { getProducts().then(setProducts); }, []);

  const handleSave = async () => {
    if (!productId) return showAlert('Error', 'Select a product');
    if (!quantity || parseInt(quantity) < 1) return showAlert('Error', 'Enter valid quantity');
    if (!reason.trim()) return showAlert('Error', 'Enter a reason');

    setLoading(true);
    try {
      await recordDamaged({ product_id: productId, quantity: parseInt(quantity), reason: reason.trim() });
      showAlert('Recorded', 'Damaged items logged and stock updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { showAlert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={st.container} keyboardShouldPersistTaps="handled">
      <View style={st.form}>
        <View style={st.iconHeader}>
          <View style={st.iconBox}><AlertTriangle color="#ef4444" size={32} /></View>
          <Text style={st.headerText}>Report Damaged Items</Text>
          <Text style={st.headerSub}>Stock will be automatically deducted</Text>
        </View>

        <View style={st.field}>
          <Text style={st.label}>Product *</Text>
          <TouchableOpacity style={st.dropdown} onPress={() => setShowProducts(!showProducts)}>
            <Text style={[st.ddText, !productId && { color: '#94a3b8' }]}>{productLabel}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
          {showProducts && <View style={st.ddList}>{products.map(p => (
            <TouchableOpacity key={p.id} style={[st.ddItem, productId === p.id && { backgroundColor: '#e0f2fe' }]}
              onPress={() => { setProductId(p.id); setProductLabel(`${p.name} (Stock: ${p.quantity})`); setShowProducts(false); }}>
              <Text style={st.ddItemText}>{p.name}</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>Stock: {p.quantity}</Text>
            </TouchableOpacity>
          ))}</View>}
        </View>

        <View style={st.field}>
          <Text style={st.label}>Quantity Damaged *</Text>
          <TextInput style={st.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>

        <View style={st.field}>
          <Text style={st.label}>Reason *</Text>
          <TextInput style={[st.input, { minHeight: 80 }]} value={reason} onChangeText={setReason} multiline placeholder="e.g., Cracked during transport" placeholderTextColor="#94a3b8" />
        </View>

        <TouchableOpacity style={[st.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>⚠️ Record Damage</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  ddText: { fontSize: 16, color: '#0f172a', flex: 1 },
  ddList: { backgroundColor: '#fff', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  ddItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  ddItemText: { fontSize: 15, color: '#334155' },
  btn: { backgroundColor: '#ef4444', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 12, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
