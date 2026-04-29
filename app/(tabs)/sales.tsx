import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Plus, Calendar, DollarSign, ChevronRight, ShoppingCart } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSales } from '../../lib/database';
import { Sale } from '../../lib/types';

export default function SalesScreen() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = useCallback(async () => {
    try {
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSales();
  }, [loadSales]);

  const formatCurrency = (amount: number) => '₹' + Number(amount).toLocaleString('en-IN');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate summary
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => new Date(s.created_at) >= todayStart);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const pendingAmount = sales
    .filter(s => s.payment_status === 'Pending')
    .reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => router.push({ pathname: '/sale-details', params: { id: item.id } })}
    >
      <View style={styles.saleHeader}>
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{item.customers?.name || 'Walk-in Customer'}</Text>
          <View style={[styles.statusBadge, item.payment_status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
            <Text style={item.payment_status === 'Paid' ? styles.statusTextPaid : styles.statusTextPending}>
              {item.payment_status}
            </Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Calendar color="#94a3b8" size={14} />
          <Text style={styles.dateText}>{formatDate(item.created_at)} • {formatTime(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.saleDivider} />

      <View style={styles.saleBody}>
        <View style={styles.productRow}>
          <Text style={styles.productName} numberOfLines={1}>{item.products?.name || 'Unknown Product'}</Text>
          <Text style={styles.quantity}>× {item.quantity}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.unitPrice}>@ {formatCurrency(Number(item.unit_price))}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(Number(item.total_amount))}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sales History</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4' }]}>
          <DollarSign color="#22c55e" size={20} />
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={[styles.summaryValue, { color: '#166534' }]}>{formatCurrency(todayRevenue)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fffbeb' }]}>
          <DollarSign color="#f59e0b" size={20} />
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: '#b45309' }]}>{formatCurrency(pendingAmount)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#f0f9ff' }]}>
          <DollarSign color="#0ea5e9" size={20} />
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={[styles.summaryValue, { color: '#0369a1' }]}>{formatCurrency(totalRevenue)}</Text>
        </View>
      </View>

      {/* Sales List */}
      {sales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingCart color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>No sales recorded yet</Text>
          <Text style={styles.emptySubtitle}>Record your first sale to get started</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-sale')}>
            <Plus color="#ffffff" size={20} />
            <Text style={styles.emptyButtonText}>Record Sale</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={renderSale}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-sale')}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  summaryContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  summaryCard: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  listContainer: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  saleCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  saleHeader: { marginBottom: 12 },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 13, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPaid: { backgroundColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusTextPaid: { color: '#166534', fontSize: 12, fontWeight: '700' },
  statusTextPending: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  saleDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  saleBody: {},
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 15, color: '#334155', flex: 1, fontWeight: '500' },
  quantity: { fontSize: 15, color: '#64748b', fontWeight: '600', marginLeft: 8 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitPrice: { fontSize: 13, color: '#94a3b8' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#0ea5e9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0ea5e9',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 20, gap: 8,
  },
  emptyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
});
