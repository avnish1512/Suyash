import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Search, Plus, User, Phone, MapPin, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCustomers, getCustomerSales, deleteCustomer } from '../../lib/database';
import { Customer } from '../../lib/types';
import { showAlert } from '../../lib/alert';

export default function CustomersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<(Customer & { totalPurchases?: number; totalSpent?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await getCustomers();
      // Fetch purchase counts for each customer
      const enriched = await Promise.all(
        data.map(async (c) => {
          try {
            const sales = await getCustomerSales(c.id);
            const totalPurchases = sales.length;
            const totalSpent = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            return { ...c, totalPurchases, totalSpent };
          } catch {
            return { ...c, totalPurchases: 0, totalSpent: 0 };
          }
        })
      );
      setCustomers(enriched);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCustomers();
  }, [loadCustomers]);

  const handleDelete = (customer: Customer) => {
    showAlert(
      'Delete Customer',
      `Are you sure you want to delete "${customer.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              loadCustomers();
            } catch (error) {
              showAlert('Error', 'Failed to delete customer. They may have existing sales.');
            }
          },
        },
      ]
    );
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCustomer = ({ item }: { item: typeof customers[0] }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => router.push({ pathname: '/customer-details', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.phone && (
          <View style={styles.contactRow}>
            <Phone color="#94a3b8" size={13} />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
        )}
        {item.address && (
          <View style={styles.contactRow}>
            <MapPin color="#94a3b8" size={13} />
            <Text style={styles.contactText} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
      </View>
      <View style={styles.statsColumn}>
        <View style={styles.purchasesBadge}>
          <Text style={styles.purchasesValue}>{item.totalPurchases || 0}</Text>
          <Text style={styles.purchasesLabel}>Orders</Text>
        </View>
        {(item.totalSpent || 0) > 0 && (
          <Text style={styles.totalSpent}>₹{Number(item.totalSpent).toLocaleString('en-IN')}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
        style={styles.deleteIconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Trash2 color="#ef4444" size={16} />
      </TouchableOpacity>
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
        <Text style={styles.title}>Customers</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#94a3b8" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filteredCustomers.length} customers</Text>
      </View>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <User color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptySubtitle}>Add customers when recording sales</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-customer')}>
            <Plus color="#ffffff" size={20} />
            <Text style={styles.emptyButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-customer')}>
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: '#ffffff' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  searchContainer: { padding: 16, paddingBottom: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a' },
  countRow: { paddingHorizontal: 16, paddingVertical: 12 },
  countText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  listContainer: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  customerCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, marginBottom: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  avatarContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#0ea5e9',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
  contactText: { fontSize: 13, color: '#64748b', flex: 1 },
  statsColumn: { alignItems: 'center', marginLeft: 8 },
  purchasesBadge: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f9ff',
    padding: 8, borderRadius: 12, minWidth: 56,
  },
  purchasesValue: { fontSize: 18, fontWeight: '800', color: '#0ea5e9' },
  purchasesLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
  totalSpent: { fontSize: 12, color: '#22c55e', fontWeight: '600', marginTop: 4 },
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
  deleteIconBtn: {
    padding: 8, marginLeft: 4, borderRadius: 8, backgroundColor: '#fef2f2',
  },
});
