import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Save, Tag, Trash2 } from 'lucide-react-native';
import { addCategory, getCategories, deleteCategory } from '../lib/database';
import { Category } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function AddCategoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = () => { getCategories().then(setCategories).catch(console.error); };
  useEffect(() => { loadCategories(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return showAlert('Error', 'Category name is required');
    setLoading(true);
    try {
      await addCategory(name.trim());
      setName('');
      loadCategories();
      showAlert('Success', 'Category added!');
    } catch (e: any) { showAlert('Error', e.message || 'Category may already exist'); }
    finally { setLoading(false); }
  };

  const handleDelete = (cat: Category) => {
    showAlert('Delete Category', `Delete "${cat.name}"? Products using this category will become uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteCategory(cat.id); loadCategories(); }
        catch { showAlert('Error', 'Failed to delete category'); }
      }},
    ]);
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <View style={s.iconHeader}>
          <View style={s.iconBox}><Tag color="#0ea5e9" size={32} /></View>
          <Text style={s.headerText}>Manage Categories</Text>
        </View>

        {/* Add New */}
        <View style={s.addRow}>
          <TextInput style={s.addInput} placeholder="New category name..." placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
          <TouchableOpacity style={[s.addBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Save color="#fff" size={20} />}
          </TouchableOpacity>
        </View>

        {/* Existing Categories */}
        <Text style={s.sectionTitle}>Existing Categories</Text>
        {categories.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>No categories yet</Text></View>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={s.catCard}>
              <View style={s.catDot} />
              <Text style={s.catName}>{cat.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(cat)} style={s.catDeleteBtn}>
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  addInput: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  addBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  catDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0ea5e9', marginRight: 12 },
  catName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  catDeleteBtn: { padding: 8 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
