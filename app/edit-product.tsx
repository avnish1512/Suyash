import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronDown, Save } from 'lucide-react-native';
import { updateProduct, getProductById, getCategories } from '../lib/database';
import { Category } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCats, setShowCats] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [catLabel, setCatLabel] = useState('Select Category');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, cats] = await Promise.all([getProductById(id!), getCategories()]);
        setCategories(cats);
        setName(p.name); setCategoryId(p.category_id);
        setCatLabel(p.categories?.name || 'Select Category');
        setCapacity(p.capacity ? String(p.capacity) : '');
        setPrice(String(p.price)); setQuantity(String(p.quantity));
        setSupplier(p.supplier || '');
      } catch { showAlert('Error', 'Failed to load'); router.back(); }
      finally { setPageLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) return showAlert('Error', 'Name and price required');
    setLoading(true);
    try {
      await updateProduct(id!, { name: name.trim(), category_id: categoryId, capacity: parseInt(capacity) || 0, price: parseFloat(price) || 0, quantity: parseInt(quantity) || 0, supplier: supplier.trim() || null });
      showAlert('Success', 'Product updated!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { showAlert('Error', e.message); }
    finally { setLoading(false); }
  };

  if (pageLoading) return <View style={s.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <View style={s.field}><Text style={s.label}>Product Name *</Text><TextInput style={s.input} value={name} onChangeText={setName} /></View>
        <View style={s.field}>
          <Text style={s.label}>Category</Text>
          <TouchableOpacity style={s.dropdown} onPress={() => setShowCats(!showCats)}>
            <Text style={[s.ddText, !categoryId && { color: '#94a3b8' }]}>{catLabel}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
          {showCats && <View style={s.ddList}>{categories.map(c => (
            <TouchableOpacity key={c.id} style={[s.ddItem, categoryId === c.id && s.ddItemActive]} onPress={() => { setCategoryId(c.id); setCatLabel(c.name); setShowCats(false); }}>
              <Text style={[s.ddItemText, categoryId === c.id && { color: '#0369a1', fontWeight: '600' }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}</View>}
        </View>
        <View style={s.field}><Text style={s.label}>Capacity (L)</Text><TextInput style={s.input} value={capacity} onChangeText={setCapacity} keyboardType="numeric" /></View>
        <View style={s.row}>
          <View style={[s.field, { flex: 1 }]}><Text style={s.label}>Price (₹) *</Text><TextInput style={s.input} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
          <View style={{ width: 12 }} />
          <View style={[s.field, { flex: 1 }]}><Text style={s.label}>Quantity</Text><TextInput style={s.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" /></View>
        </View>
        <View style={s.field}><Text style={s.label}>Supplier</Text><TextInput style={s.input} value={supplier} onChangeText={setSupplier} /></View>
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={20} /><Text style={s.btnText}>Save Changes</Text></>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  form: { padding: 20 }, field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row' },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  ddText: { fontSize: 16, color: '#0f172a' },
  ddList: { backgroundColor: '#fff', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  ddItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  ddItemActive: { backgroundColor: '#e0f2fe' },
  ddItemText: { fontSize: 15, color: '#334155' },
  btn: { backgroundColor: '#0ea5e9', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
