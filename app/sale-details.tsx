import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Calendar, User, Package, DollarSign, CheckCircle, Clock, Trash2 } from 'lucide-react-native';
import { getSaleById, updateSalePaymentStatus, deleteSale } from '../lib/database';
import { Sale } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function SaleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSaleById(id!).then(setSale).catch(() => { showAlert('Error', 'Sale not found'); router.back(); }).finally(() => setLoading(false));
  }, [id]);

  const togglePayment = async () => {
    if (!sale) return;
    const newStatus = sale.payment_status === 'Paid' ? 'Pending' : 'Paid';
    try {
      await updateSalePaymentStatus(sale.id, newStatus);
      setSale({ ...sale, payment_status: newStatus });
    } catch { showAlert('Error', 'Failed to update'); }
  };

  const repeatSale = () => {
    if (!sale) return;
    router.push({ pathname: '/add-sale', params: { productId: sale.product_id || '', customerId: sale.customer_id || '' } });
  };

  const handleDelete = () => {
    if (!sale) return;
    showAlert('Delete Sale', 'Are you sure you want to delete this sale? Stock will be restored.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteSale(sale.id);
          router.back();
        } catch (e: any) {
          showAlert('Error', e.message || 'Failed to delete sale');
        }
      }},
    ]);
  };

  if (loading || !sale) return <View style={s.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  const date = new Date(sale.created_at);
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <ScrollView style={s.container}>
      {/* Amount Header */}
      <View style={[s.header, sale.payment_status === 'Paid' ? { backgroundColor: '#22c55e' } : { backgroundColor: '#f59e0b' }]}>
        <Text style={s.headerLabel}>Total Amount</Text>
        <Text style={s.headerAmount}>{fmt(Number(sale.total_amount))}</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{sale.payment_status === 'Paid' ? '✅ Paid' : '⏳ Pending'}</Text>
        </View>
      </View>

      <View style={s.content}>
        {/* Customer Info */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <User color="#0ea5e9" size={20} />
            <Text style={s.cardLabel}>Customer</Text>
          </View>
          <Text style={s.cardValue}>{sale.customers?.name || 'Unknown'}</Text>
          {sale.customers?.phone && <Text style={s.cardSub}>{sale.customers.phone}</Text>}
          {sale.customers?.address && <Text style={s.cardSub}>{sale.customers.address}</Text>}
        </View>

        {/* Product Info */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Package color="#8b5cf6" size={20} />
            <Text style={s.cardLabel}>Product</Text>
          </View>
          <Text style={s.cardValue}>{sale.products?.name || 'Unknown'}</Text>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Quantity:</Text>
            <Text style={s.detailValue}>{sale.quantity}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Unit Price:</Text>
            <Text style={s.detailValue}>{fmt(Number(sale.unit_price))}</Text>
          </View>
        </View>

        {/* Date */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Calendar color="#f59e0b" size={20} />
            <Text style={s.cardLabel}>Date & Time</Text>
          </View>
          <Text style={s.cardValue}>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Text style={s.cardSub}>{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        {sale.notes && (
          <View style={s.card}>
            <Text style={s.cardLabel}>Notes</Text>
            <Text style={s.cardSub}>{sale.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: sale.payment_status === 'Paid' ? '#fef3c7' : '#dcfce7' }]} onPress={togglePayment}>
          {sale.payment_status === 'Paid'
            ? <><Clock color="#b45309" size={20} /><Text style={[s.actionText, { color: '#b45309' }]}>Mark as Pending</Text></>
            : <><CheckCircle color="#166534" size={20} /><Text style={[s.actionText, { color: '#166534' }]}>Mark as Paid</Text></>
          }
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#e0f2fe' }]} onPress={repeatSale}>
          <DollarSign color="#0369a1" size={20} />
          <Text style={[s.actionText, { color: '#0369a1' }]}>🔄 Repeat Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={handleDelete}>
          <Trash2 color="#ef4444" size={20} />
          <Text style={[s.actionText, { color: '#ef4444' }]}>🗑️ Delete Sale</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { padding: 32, alignItems: 'center' },
  headerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  headerAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 14, color: '#64748b' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8, marginBottom: 10 },
  actionText: { fontSize: 16, fontWeight: '600' },
});
