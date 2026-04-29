import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronDown, Save } from 'lucide-react-native';
import { addProduct, getCategories } from '../lib/database';
import { Category } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('Select Category');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return showAlert('Error', 'Product name is required');
    if (!price.trim()) return showAlert('Error', 'Price is required');
    if (!quantity.trim()) return showAlert('Error', 'Quantity is required');

    setLoading(true);
    try {
      await addProduct({
        name: name.trim(),
        category_id: categoryId,
        capacity: parseInt(capacity) || 0,
        price: parseFloat(price) || 0,
        quantity: parseInt(quantity) || 0,
        supplier: supplier.trim() || null,
      });
      showAlert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Product Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500L Sintex Water Tank"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={[styles.dropdownText, !categoryId && { color: '#94a3b8' }]}>
              {categoryName}
            </Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
          {showCategories && (
            <View style={styles.dropdownList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.dropdownItem, categoryId === cat.id && styles.dropdownItemActive]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setCategoryName(cat.name);
                    setShowCategories(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, categoryId === cat.id && styles.dropdownItemTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Capacity */}
        <View style={styles.field}>
          <Text style={styles.label}>Capacity (Liters)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500"
            placeholderTextColor="#94a3b8"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />
        </View>

        {/* Price & Quantity Row */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 3500"
              placeholderTextColor="#94a3b8"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10"
              placeholderTextColor="#94a3b8"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Supplier */}
        <View style={styles.field}>
          <Text style={styles.label}>Supplier (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sintex Industries"
            placeholderTextColor="#94a3b8"
            value={supplier}
            onChangeText={setSupplier}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Save color="#ffffff" size={20} />
              <Text style={styles.saveButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0',
  },
  row: { flexDirection: 'row' },
  dropdown: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  dropdownText: { fontSize: 16, color: '#0f172a' },
  dropdownList: {
    backgroundColor: '#ffffff', borderRadius: 14, marginTop: 8,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#e0f2fe' },
  dropdownItemText: { fontSize: 15, color: '#334155' },
  dropdownItemTextActive: { color: '#0369a1', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#0ea5e9', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});
