import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Package, ShoppingCart, AlertTriangle, TrendingDown, Plus, DollarSign, Clock, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { getDashboardStats } from '../../lib/database';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStock: 0,
    totalProducts: 0,
    totalSold: 0,
    totalDamaged: 0,
    lowStockCount: 0,
    lowStockProducts: [] as any[],
    todayRevenue: 0,
    todaySoldCount: 0,
    pendingAmount: 0,
    recentTransactions: [] as any[],
  });

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add': return { icon: Plus, color: '#22c55e', bg: '#dcfce7' };
      case 'sold': return { icon: ShoppingCart, color: '#0ea5e9', bg: '#e0f2fe' };
      case 'damaged': return { icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2' };
      default: return { icon: Package, color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Connecting to TankTracker...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle color="#ef4444" size={48} />
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSub}>Make sure you have run the SQL schema in your Supabase dashboard.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
        </View>
      </View>

      {/* Today's Summary */}
      <View style={styles.todayCard}>
        <View style={styles.todayCardContent}>
          <View>
            <Text style={styles.todayLabel}>Today's Revenue</Text>
            <Text style={styles.todayValue}>{formatCurrency(stats.todayRevenue)}</Text>
            <Text style={styles.todaySub}>{stats.todaySoldCount} items sold today</Text>
          </View>
          <View style={styles.todayIconBox}>
            <DollarSign color="#ffffff" size={32} />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#f0f9ff' }]} onPress={() => router.push('/(tabs)/inventory')}>
          <View style={[styles.statIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Package color="#0ea5e9" size={22} />
          </View>
          <Text style={[styles.statValue, { color: '#0369a1' }]}>{stats.totalStock}</Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#f0fdf4' }]} onPress={() => router.push('/(tabs)/sales')}>
          <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
            <ShoppingCart color="#22c55e" size={22} />
          </View>
          <Text style={[styles.statValue, { color: '#166534' }]}>{stats.totalSold}</Text>
          <Text style={styles.statLabel}>Total Sold</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: '#fffbeb' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
            <AlertTriangle color="#f59e0b" size={22} />
          </View>
          <Text style={[styles.statValue, { color: '#b45309' }]}>{stats.lowStockCount}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#fee2e2' }]}>
            <TrendingDown color="#ef4444" size={22} />
          </View>
          <Text style={[styles.statValue, { color: '#991b1b' }]}>{stats.totalDamaged}</Text>
          <Text style={styles.statLabel}>Damaged</Text>
        </View>
      </View>

      {/* Pending Payments */}
      {stats.pendingAmount > 0 && (
        <TouchableOpacity style={styles.pendingCard} onPress={() => router.push('/(tabs)/sales')}>
          <View style={styles.pendingLeft}>
            <Clock color="#f59e0b" size={20} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.pendingLabel}>Pending Payments</Text>
              <Text style={styles.pendingValue}>{formatCurrency(stats.pendingAmount)}</Text>
            </View>
          </View>
          <ArrowRight color="#f59e0b" size={20} />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-product')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#e0f2fe' }]}>
              <Package color="#0ea5e9" size={24} />
            </View>
            <Text style={styles.quickActionText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-sale')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <ShoppingCart color="#22c55e" size={24} />
            </View>
            <Text style={styles.quickActionText}>Record Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-stock')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
              <Plus color="#8b5cf6" size={24} />
            </View>
            <Text style={styles.quickActionText}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-damaged')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fee2e2' }]}>
              <AlertTriangle color="#ef4444" size={24} />
            </View>
            <Text style={styles.quickActionText}>Damaged</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Low Stock Alerts */}
      {stats.lowStockProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Low Stock Alerts</Text>
          <View style={styles.alertsCard}>
            {stats.lowStockProducts.map((product: any, index: number) => (
              <View key={product.id}>
                <TouchableOpacity
                  style={styles.alertItem}
                  onPress={() => router.push({ pathname: '/product-details', params: { id: product.id } })}
                >
                  <View style={styles.alertLeft}>
                    <Text style={styles.alertName}>{product.name}</Text>
                    <Text style={styles.alertCapacity}>{product.capacity ? `${product.capacity}L` : 'Standard'}</Text>
                  </View>
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{product.quantity} left</Text>
                  </View>
                </TouchableOpacity>
                {index < stats.lowStockProducts.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Activity */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent activity yet.</Text>
            <Text style={styles.emptySubText}>Start by adding products!</Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {stats.recentTransactions.map((t: any, index: number) => {
              const { icon: Icon, color, bg } = getTransactionIcon(t.type);
              return (
                <View key={t.id}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIconBox, { backgroundColor: bg }]}>
                      <Icon color={color} size={18} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>
                        {t.type === 'add' ? 'Stock Added' : t.type === 'sold' ? 'Sold' : 'Damaged'}
                      </Text>
                      <Text style={styles.activitySub}>
                        {t.products?.name || 'Unknown'} × {t.quantity}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>{formatTime(t.created_at)}</Text>
                  </View>
                  {index < stats.recentTransactions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 15, color: '#64748b', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  todayBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  todayText: { color: '#0369a1', fontWeight: '600', fontSize: 13 },
  todayCard: {
    marginHorizontal: 20, marginTop: 12, borderRadius: 20, padding: 24,
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  todayCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  todayValue: { color: '#ffffff', fontSize: 32, fontWeight: '800', marginVertical: 4 },
  todaySub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  todayIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  statCard: {
    width: '47%', padding: 16, borderRadius: 16, flexGrow: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  pendingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginTop: 4, padding: 16, borderRadius: 14,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7',
  },
  pendingLeft: { flexDirection: 'row', alignItems: 'center' },
  pendingLabel: { fontSize: 13, color: '#92400e', fontWeight: '500' },
  pendingValue: { fontSize: 18, color: '#b45309', fontWeight: '700' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', width: '23%' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' },
  alertsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  alertLeft: { flex: 1 },
  alertName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  alertCapacity: { fontSize: 13, color: '#64748b', marginTop: 2 },
  alertBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  alertBadgeText: { color: '#991b1b', fontSize: 13, fontWeight: '700' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '500' },
  emptySubText: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  activityCard: { backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  activityIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  activitySub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  activityTime: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f8fafc' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 16 },
  errorText: { fontSize: 16, color: '#ef4444', marginTop: 8, textAlign: 'center' },
  errorSub: { fontSize: 14, color: '#64748b', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  retryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});
