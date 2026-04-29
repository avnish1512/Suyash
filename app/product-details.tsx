import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Edit3, Trash2, Plus, ShoppingCart, AlertTriangle, Package } from 'lucide-react-native';
import { getProductById, deleteProduct } from '../lib/database';
import { Product } from '../lib/types';
import { useFocusEffect } from 'expo-router';
import { showAlert } from '../lib/alert';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    try {
      const data = await getProductById(id!);
      setProduct(data);
    } catch { showAlert('Error', 'Product not found'); router.back(); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { loadProduct(); }, [loadProduct]));

  const handleDelete = () => {
    showAlert('Delete Product', `Delete "${product?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteProduct(id!); router.back(); }
        catch { showAlert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  if (loading || !product) return <View style={s.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  const isLow = product.quantity < 10;

  return (
    <ScrollView style={s.container}>
      {/* Product Header */}
      <View style={s.header}>
        <View style={[s.iconBox, { backgroundColor: isLow ? '#fee2e2' : '#e0f2fe' }]}>
          <Package color={isLow ? '#ef4444' : '#0ea5e9'} size={40} />
        </View>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.category}>{product.categories?.name || 'Uncategorized'} {product.capacity ? `• ${product.capacity}L` : ''}</Text>
        {product.supplier && <Text style={s.supplier}>Supplier: {product.supplier}</Text>}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Price</Text>
          <Text style={[s.statVal, { color: '#0ea5e9' }]}>₹{Number(product.price).toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>In Stock</Text>
          <Text style={[s.statVal, { color: isLow ? '#ef4444' : '#22c55e' }]}>{product.quantity}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Value</Text>
          <Text style={[s.statVal, { color: '#8b5cf6' }]}>₹{(Number(product.price) * product.quantity).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {isLow && (
        <View style={s.alertBox}>
          <AlertTriangle color="#b45309" size={18} />
          <Text style={s.alertText}>Low stock! Only {product.quantity} remaining.</Text>
        </View>
      )}

      {/* Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Stock Actions</Text>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#e0f2fe' }]}
          onPress={() => router.push({ pathname: '/add-stock', params: { id: product.id, name: product.name } })}>
          <Plus color="#0369a1" size={22} />
          <Text style={[s.actionText, { color: '#0369a1' }]}>Add Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#dcfce7' }]}
          onPress={() => router.push({ pathname: '/add-sale', params: { productId: product.id, productName: product.name, productPrice: String(product.price) } })}>
          <ShoppingCart color="#166534" size={22} />
          <Text style={[s.actionText, { color: '#166534' }]}>Record Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fee2e2' }]}
          onPress={() => router.push({ pathname: '/add-damaged', params: { productId: product.id, productName: product.name } })}>
          <AlertTriangle color="#991b1b" size={22} />
          <Text style={[s.actionText, { color: '#991b1b' }]}>Mark as Damaged</Text>
        </TouchableOpacity>
      </View>

      {/* Edit / Delete */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Manage</Text>
        <View style={s.manageRow}>
          <TouchableOpacity style={s.editBtn}
            onPress={() => router.push({ pathname: '/edit-product', params: { id: product.id } })}>
            <Edit3 color="#0ea5e9" size={20} />
            <Text style={s.editText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Trash2 color="#ef4444" size={20} />
            <Text style={s.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', padding: 24, paddingTop: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  category: { fontSize: 15, color: '#64748b', marginTop: 4 },
  supplier: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '800' },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', margin: 16, marginTop: 0, padding: 14, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#fef3c7' },
  alertText: { color: '#92400e', fontSize: 14, fontWeight: '500', flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, gap: 12, marginBottom: 10 },
  actionText: { fontSize: 16, fontWeight: '600' },
  manageRow: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, backgroundColor: '#e0f2fe', gap: 8 },
  editText: { fontSize: 15, fontWeight: '600', color: '#0ea5e9' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, backgroundColor: '#fee2e2', gap: 8, paddingHorizontal: 24 },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
