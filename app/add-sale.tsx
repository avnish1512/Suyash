import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronDown, Save, UserPlus } from 'lucide-react-native';
import { recordSale, getProducts, getCustomers, addCustomer } from '../lib/database';
import { Product, Customer } from '../lib/types';
import { showAlert } from '../lib/alert';

export default function AddSaleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; productName?: string; productPrice?: string; customerId?: string }>();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [productId, setProductId] = useState(params.productId || '');
  const [productLabel, setProductLabel] = useState(params.productName || 'Select Product');
  const [customerId, setCustomerId] = useState(params.customerId || '');
  const [customerLabel, setCustomerLabel] = useState('Select Customer');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState(params.productPrice || '');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState('');

  // New customer fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    Promise.all([getProducts(), getCustomers()]).then(([p, c]) => {
      setProducts(p); setCustomers(c);
      if (params.customerId) {
        const cust = c.find(x => x.id === params.customerId);
        if (cust) setCustomerLabel(cust.name);
      }
    });
  }, []);

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return showAlert('Error', 'Customer name required');
    try {
      const c = await addCustomer({ name: newName.trim(), phone: newPhone.trim() || null, address: newAddress.trim() || null });
      setCustomerId(c.id); setCustomerLabel(c.name);
      setCustomers(prev => [...prev, c]);
      setShowNewCustomer(false); setNewName(''); setNewPhone(''); setNewAddress('');
    } catch (e: any) { showAlert('Error', e.message); }
  };

  const handleSave = async () => {
    if (!productId) return showAlert('Error', 'Select a product');
    if (!customerId) return showAlert('Error', 'Select a customer');
    if (!quantity || parseInt(quantity) < 1) return showAlert('Error', 'Enter valid quantity');
    if (!unitPrice) return showAlert('Error', 'Enter unit price');

    setLoading(true);
    try {
      await recordSale({ product_id: productId, customer_id: customerId, quantity: parseInt(quantity), unit_price: parseFloat(unitPrice), payment_status: paymentStatus, notes: notes.trim() || undefined });
      showAlert('✅ Sale Recorded!', `${quantity} × ${productLabel}\nTotal: ₹${totalAmount.toLocaleString('en-IN')}\nStatus: ${paymentStatus}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) { showAlert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={st.container} keyboardShouldPersistTaps="handled">
      <View style={st.form}>
        {/* Product Selector */}
        <View style={st.field}>
          <Text style={st.label}>Product *</Text>
          <TouchableOpacity style={st.dropdown} onPress={() => { setShowProducts(!showProducts); setShowCustomers(false); }}>
            <Text style={[st.ddText, !productId && { color: '#94a3b8' }]}>{productLabel}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
          {showProducts && <View style={st.ddList}>{products.map(p => (
            <TouchableOpacity key={p.id} style={[st.ddItem, productId === p.id && st.ddActive]}
              onPress={() => { setProductId(p.id); setProductLabel(p.name); setUnitPrice(String(p.price)); setShowProducts(false); }}>
              <View style={{ flex: 1 }}>
                <Text style={st.ddItemText}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Stock: {p.quantity} • ₹{Number(p.price).toLocaleString('en-IN')}</Text>
              </View>
            </TouchableOpacity>
          ))}</View>}
        </View>

        {/* Customer Selector */}
        <View style={st.field}>
          <Text style={st.label}>Customer *</Text>
          <TouchableOpacity style={st.dropdown} onPress={() => { setShowCustomers(!showCustomers); setShowProducts(false); }}>
            <Text style={[st.ddText, !customerId && { color: '#94a3b8' }]}>{customerLabel}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
          {showCustomers && <View style={st.ddList}>
            <TouchableOpacity style={[st.ddItem, { backgroundColor: '#f0f9ff' }]} onPress={() => { setShowCustomers(false); setShowNewCustomer(true); }}>
              <UserPlus color="#0ea5e9" size={18} />
              <Text style={[st.ddItemText, { color: '#0ea5e9', fontWeight: '600', marginLeft: 8 }]}>+ New Customer</Text>
            </TouchableOpacity>
            {customers.map(c => (
              <TouchableOpacity key={c.id} style={[st.ddItem, customerId === c.id && st.ddActive]}
                onPress={() => { setCustomerId(c.id); setCustomerLabel(c.name); setShowCustomers(false); }}>
                <Text style={st.ddItemText}>{c.name}</Text>
                {c.phone && <Text style={{ fontSize: 12, color: '#94a3b8' }}>{c.phone}</Text>}
              </TouchableOpacity>
            ))}
          </View>}
        </View>

        {/* New Customer Inline Form */}
        {showNewCustomer && (
          <View style={st.newCustBox}>
            <Text style={st.newCustTitle}>Quick Add Customer</Text>
            <TextInput style={st.input} placeholder="Customer Name *" placeholderTextColor="#94a3b8" value={newName} onChangeText={setNewName} />
            <TextInput style={[st.input, { marginTop: 8 }]} placeholder="Phone (optional)" placeholderTextColor="#94a3b8" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
            <TextInput style={[st.input, { marginTop: 8 }]} placeholder="Address (optional)" placeholderTextColor="#94a3b8" value={newAddress} onChangeText={setNewAddress} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[st.smallBtn, { backgroundColor: '#f1f5f9' }]} onPress={() => setShowNewCustomer(false)}>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.smallBtn, { backgroundColor: '#0ea5e9', flex: 1 }]} onPress={handleCreateCustomer}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quantity & Price */}
        <View style={st.row}>
          <View style={[st.field, { flex: 1 }]}>
            <Text style={st.label}>Quantity *</Text>
            <TextInput style={st.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={{ width: 12 }} />
          <View style={[st.field, { flex: 1 }]}>
            <Text style={st.label}>Unit Price (₹)</Text>
            <TextInput style={st.input} value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" />
          </View>
        </View>

        {/* Total */}
        <View style={st.totalBox}>
          <Text style={st.totalLabel}>Total Amount</Text>
          <Text style={st.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>

        {/* Payment Status */}
        <View style={st.field}>
          <Text style={st.label}>Payment Status</Text>
          <View style={st.statusRow}>
            <TouchableOpacity style={[st.statusBtn, paymentStatus === 'Paid' && st.statusActive]}
              onPress={() => setPaymentStatus('Paid')}>
              <Text style={[st.statusText, paymentStatus === 'Paid' && st.statusTextActive]}>✅ Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.statusBtn, paymentStatus === 'Pending' && st.statusPending]}
              onPress={() => setPaymentStatus('Pending')}>
              <Text style={[st.statusText, paymentStatus === 'Pending' && st.statusTextPending]}>⏳ Pending</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={st.field}>
          <Text style={st.label}>Notes (Optional)</Text>
          <TextInput style={[st.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} multiline placeholder="Any notes..." placeholderTextColor="#94a3b8" />
        </View>

        {/* Save */}
        <TouchableOpacity style={[st.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.saveBtnText}>💰 Record Sale</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  form: { padding: 20 }, field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row' },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  ddText: { fontSize: 16, color: '#0f172a' },
  ddList: { backgroundColor: '#fff', borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', maxHeight: 250 },
  ddItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' },
  ddActive: { backgroundColor: '#e0f2fe' },
  ddItemText: { fontSize: 15, color: '#334155' },
  newCustBox: { backgroundColor: '#f0f9ff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#bae6fd' },
  newCustTitle: { fontSize: 15, fontWeight: '700', color: '#0369a1', marginBottom: 12 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#166534' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#166534' },
  statusRow: { flexDirection: 'row', gap: 12 },
  statusBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#f1f5f9' },
  statusActive: { backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#22c55e' },
  statusPending: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  statusTextActive: { color: '#166534' },
  statusTextPending: { color: '#b45309' },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
