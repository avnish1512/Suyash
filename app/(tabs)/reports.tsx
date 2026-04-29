import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getMonthlyReport, getDailyReport, getDashboardStats } from '../../lib/database';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const loadReport = useCallback(async () => {
    try {
      const [monthlyData, dailyData, statsData] = await Promise.all([
        getMonthlyReport(currentYear, currentMonth),
        getDailyReport(new Date()),
        getDashboardStats(),
      ]);
      setReport(monthlyData);
      setDailyReport(dailyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth, currentYear]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReport();
  }, [loadReport]);

  const formatCurrency = (amount: number) => '₹' + Number(amount).toLocaleString('en-IN');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setLoading(true);
  };

  const nextMonth = () => {
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setLoading(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Business Reports</Text>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Calendar color="#0ea5e9" size={20} />
          <Text style={styles.monthText}>{monthNames[currentMonth - 1]} {currentYear}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
          <ChevronRight color="#0f172a" size={24} />
        </TouchableOpacity>
      </View>

      {/* Check if we have any sales data for the selected month */}
      {report?.totalItems === 0 && report?.totalRevenue === 0 && (dailyReport?.totalItems || 0) === 0 ? (
        <View style={styles.noSalesContainer}>
          <BarChart3 color="#cbd5e1" size={64} />
          <Text style={styles.noSalesTitle}>No Sales Activity</Text>
          <Text style={styles.noSalesText}>There are no sales recorded for {monthNames[currentMonth - 1]} {currentYear} yet.</Text>
        </View>
      ) : (
        <>
          {/* Today's Summary */}
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>📅 Today's Performance</Text>
            <View style={styles.todayRow}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatValue}>{formatCurrency(dailyReport?.totalRevenue || 0)}</Text>
                <Text style={styles.todayStatLabel}>Revenue</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Text style={styles.todayStatValue}>{dailyReport?.totalItems || 0}</Text>
                <Text style={styles.todayStatLabel}>Items Sold</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Text style={styles.todayStatValue}>{dailyReport?.sales?.length || 0}</Text>
                <Text style={styles.todayStatLabel}>Orders</Text>
              </View>
            </View>
          </View>

          {/* Monthly Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales Performance ({monthNames[currentMonth - 1]})</Text>
            <View style={styles.overviewGrid}>
              <View style={[styles.overviewCard, { backgroundColor: '#f0f9ff' }]}>
                <DollarSign color="#0ea5e9" size={22} />
                <Text style={[styles.overviewValue, { color: '#0369a1' }]}>{formatCurrency(report?.totalRevenue || 0)}</Text>
                <Text style={styles.overviewLabel}>Monthly Revenue</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#f0fdf4' }]}>
                <Package color="#22c55e" size={22} />
                <Text style={[styles.overviewValue, { color: '#166534' }]}>{report?.totalItems || 0}</Text>
                <Text style={styles.overviewLabel}>Monthly Items</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#dcfce7' }]}>
                <TrendingUp color="#22c55e" size={22} />
                <Text style={[styles.overviewValue, { color: '#166534' }]}>{formatCurrency(report?.paidAmount || 0)}</Text>
                <Text style={styles.overviewLabel}>Paid Revenue</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#fef3c7' }]}>
                <TrendingDown color="#f59e0b" size={22} />
                <Text style={[styles.overviewValue, { color: '#b45309' }]}>{formatCurrency(report?.pendingAmount || 0)}</Text>
                <Text style={styles.overviewLabel}>Pending Due</Text>
              </View>
            </View>
          </View>

          {/* Top Selling Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Selling Products</Text>
            {report?.topProducts?.length > 0 ? (
              <View style={styles.listCard}>
                {report.topProducts.map((product: any, index: number) => (
                  <View key={index}>
                    <View style={styles.listItem}>
                      <View style={[styles.rankBadge, index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : styles.rankDefault]}>
                        <Text style={[styles.rankText, index <= 1 && { color: index === 0 ? '#ca8a04' : '#475569' }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{product.name}</Text>
                        <Text style={styles.itemSub}>{product.quantity} units sold</Text>
                      </View>
                      <Text style={styles.itemRevenue}>{formatCurrency(product.revenue)}</Text>
                    </View>
                    {index < report.topProducts.length - 1 && <View style={styles.listDivider} />}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No product sales yet</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Stock Overview - Always show as it's "Current Data" */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Current Inventory Status</Text>
          <View style={styles.liveBadge}><Text style={styles.liveText}>Live</Text></View>
        </View>
        <View style={styles.stockRow}>
          <View style={styles.stockCard}>
            <Text style={styles.stockValue}>{stats?.totalStock || 0}</Text>
            <Text style={styles.stockLabel}>Units in Stock</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={[styles.stockValue, { color: '#ef4444' }]}>{stats?.totalDamaged || 0}</Text>
            <Text style={styles.stockLabel}>Damaged</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={[styles.stockValue, { color: '#f59e0b' }]}>{stats?.lowStockCount || 0}</Text>
            <Text style={styles.stockLabel}>Low Stock</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: '#ffffff' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  monthArrow: { padding: 8 },
  monthCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  todayCard: {
    margin: 16, padding: 20, borderRadius: 16, backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  todayLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  todayStat: { flex: 1, alignItems: 'center' },
  todayStatValue: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  todayStatLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' },
  todayDivider: { width: 1, height: 40, backgroundColor: '#f1f5f9' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  overviewCard: {
    width: '47%', flexGrow: 1, padding: 16, borderRadius: 16, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  overviewValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  overviewLabel: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  stockRow: { flexDirection: 'row', gap: 10 },
  stockCard: {
    flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stockValue: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  stockLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' },
  listCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rankGold: { backgroundColor: '#fef08a' },
  rankSilver: { backgroundColor: '#e2e8f0' },
  rankDefault: { backgroundColor: '#f1f5f9' },
  rankText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemRevenue: { fontSize: 15, fontWeight: '700', color: '#0ea5e9' },
  listDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },
  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  noSalesContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  noSalesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
  },
  noSalesText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  liveText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
