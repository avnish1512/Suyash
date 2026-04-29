import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { User, Phone, MapPin, ShoppingCart, Calendar, Edit3, Trash2 } from 'lucide-react-native';
import { getCustomerById, getCustomerSales, deleteCustomer, updateCustomer } from '../lib/database';
import { Customer, Sale } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getCustomerById(id!), getCustomerSales(id!)]);
      setCustomer(c); setSales(s);
    } catch { showAlert('Error', 'Customer not found'); router.back(); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = () => {
    showAlert('Delete Customer', `Delete "${customer?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteCustomer(id!); router.back(); }
        catch { showAlert('Error', 'Cannot delete customer with existing sales'); }
      }},
    ]);
  };

  if (loading || !customer) return <View style={s.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  const totalSpent = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const pendingAmt = sales.filter(sale => sale.payment_status === 'Pending').reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <ScrollView style={s.container}>
      {/* Customer Header */}
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <Text style={s.name}>{customer.name}</Text>
        {customer.phone && <View style={s.contactRow}><Phone color="#94a3b8" size={14} /><Text style={s.contactText}>{customer.phone}</Text></View>}
        {customer.address && <View style={s.contactRow}><MapPin color="#94a3b8" size={14} /><Text style={s.contactText}>{customer.address}</Text></View>}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={s.statLabel}>Orders</Text><Text style={[s.statVal, { color: '#0ea5e9' }]}>{sales.length}</Text></View>
        <View style={s.statCard}><Text style={s.statLabel}>Total Spent</Text><Text style={[s.statVal, { color: '#22c55e' }]}>{fmt(totalSpent)}</Text></View>
        <View style={s.statCard}><Text style={s.statLabel}>Pending</Text><Text style={[s.statVal, { color: '#f59e0b' }]}>{fmt(pendingAmt)}</Text></View>
      </View>

      {/* Quick Sale */}
      <TouchableOpacity style={s.quickSaleBtn} onPress={() => router.push({ pathname: '/add-sale', params: { customerId: customer.id } })}>
        <ShoppingCart color="#fff" size={20} />
        <Text style={s.quickSaleText}>Record Sale for {customer.name}</Text>
      </TouchableOpacity>

      {/* Purchase History */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Purchase History</Text>
        {sales.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>No purchases yet</Text></View>
        ) : (
          sales.map((sale) => (
            <TouchableOpacity key={sale.id} style={s.saleCard}
              onPress={() => router.push({ pathname: '/sale-details', params: { id: sale.id } })}>
              <View style={s.saleTop}>
                <Text style={s.saleProd} numberOfLines={1}>{sale.products?.name || 'Unknown'}</Text>
                <View style={[s.badge, sale.payment_status === 'Paid' ? s.badgePaid : s.badgePending]}>
                  <Text style={sale.payment_status === 'Paid' ? s.badgeTextPaid : s.badgeTextPending}>{sale.payment_status}</Text>
                </View>
              </View>
              <View style={s.saleBot}>
                <Text style={s.saleDate}>{new Date(sale.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <Text style={s.saleQty}>×{sale.quantity}</Text>
                <Text style={s.saleAmt}>{fmt(Number(sale.total_amount))}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Manage */}
      <View style={s.section}>
        <View style={s.manageRow}>
          <TouchableOpacity style={s.editBtn} onPress={() => router.push({ pathname: '/edit-customer' as any, params: { id: customer.id } })}>
            <Edit3 color="#0ea5e9" size={18} /><Text style={s.editText}>Edit Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Trash2 color="#ef4444" size={18} /><Text style={s.deleteText}>Delete</Text>
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
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contactText: { fontSize: 14, color: '#64748b' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  quickSaleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', marginHorizontal: 16, padding: 16, borderRadius: 14, gap: 8, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  quickSaleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  saleCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  saleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  saleProd: { fontSize: 15, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePaid: { backgroundColor: '#dcfce7' }, badgePending: { backgroundColor: '#fef3c7' },
  badgeTextPaid: { color: '#166534', fontSize: 11, fontWeight: '700' }, badgeTextPending: { color: '#b45309', fontSize: 11, fontWeight: '700' },
  saleBot: { flexDirection: 'row', alignItems: 'center' },
  saleDate: { fontSize: 13, color: '#94a3b8', flex: 1 },
  saleQty: { fontSize: 13, color: '#64748b', fontWeight: '600', marginRight: 12 },
  saleAmt: { fontSize: 16, fontWeight: '700', color: '#0ea5e9' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, backgroundColor: '#fee2e2', gap: 8, paddingHorizontal: 24 },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  manageRow: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, backgroundColor: '#e0f2fe', gap: 8 },
  editText: { fontSize: 15, fontWeight: '600', color: '#0ea5e9' },
});
