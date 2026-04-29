import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Search, Plus, Filter, Package, Droplets, Bath, ChevronRight, Trash2 } from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getProducts, getCategories, deleteProduct } from '../../lib/database';
import { Product, Category } from '../../lib/types';
import { showAlert } from '../../lib/alert';

export default function InventoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleDelete = (product: Product) => {
    showAlert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              loadData();
            } catch (error) {
              showAlert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (catName?: string) => {
    if (!catName) return Package;
    const lower = catName.toLowerCase();
    if (lower.includes('loft')) return Bath;
    if (lower.includes('water')) return Droplets;
    if (lower.includes('sink')) return Bath;
    return Package;
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const renderProduct = ({ item }: { item: Product }) => {
    const Icon = getCategoryIcon(item.categories?.name);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push({ pathname: '/product-details', params: { id: item.id } })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.productIconContainer, { backgroundColor: item.quantity < 10 ? '#fef2f2' : '#f0f9ff' }]}>
          <Icon color={item.quantity < 10 ? '#ef4444' : '#0ea5e9'} size={24} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productCategory}>
            {item.categories?.name || 'Uncategorized'} {item.capacity ? `• ${item.capacity}L` : ''}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
            <View style={[styles.stockBadge, item.quantity < 10 ? styles.stockLow : styles.stockNormal]}>
              <Text style={item.quantity < 10 ? styles.stockTextLow : styles.stockTextNormal}>
                {item.quantity} in stock
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
          style={styles.deleteIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 color="#ef4444" size={16} />
        </TouchableOpacity>
        <ChevronRight color="#cbd5e1" size={20} />
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>Inventory</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#94a3b8" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          contentContainerStyle={styles.categoryFilterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === item.id && styles.categoryChipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filteredProducts.length} products</Text>
        <TouchableOpacity onPress={() => router.push('/add-category')}>
          <Text style={styles.manageCategoriesText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Add your first product to get started</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-product')}>
            <Plus color="#ffffff" size={20} />
            <Text style={styles.emptyButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-product')}>
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
  searchContainer: { padding: 16, paddingBottom: 8, backgroundColor: '#ffffff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a' },
  categoryFilterContainer: { backgroundColor: '#ffffff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  categoryFilterList: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f1f5f9', marginRight: 0,
  },
  categoryChipActive: { backgroundColor: '#0ea5e9' },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  categoryChipTextActive: { color: '#ffffff' },
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  countText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  manageCategoriesText: { fontSize: 14, color: '#0ea5e9', fontWeight: '600' },
  listContainer: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  productCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, marginBottom: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  productIconContainer: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 3 },
  productCategory: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#0ea5e9' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockNormal: { backgroundColor: '#dcfce7' },
  stockLow: { backgroundColor: '#fee2e2' },
  stockTextNormal: { color: '#166534', fontSize: 12, fontWeight: '600' },
  stockTextLow: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
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
    padding: 8, marginRight: 4, borderRadius: 8, backgroundColor: '#fef2f2',
  },
});
