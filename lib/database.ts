import { supabase } from './supabase';
import { Category, Product, Customer, Sale, Transaction, DamagedLog } from './types';

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function addCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function addProduct(product: {
  name: string;
  category_id: string | null;
  capacity: number;
  price: number;
  quantity: number;
  supplier: string | null;
}): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, categories(*)')
    .single();
  if (error) throw error;

  // Log the initial stock addition as a transaction
  if (product.quantity > 0) {
    await supabase.from('transactions').insert({
      product_id: data.id,
      type: 'add',
      quantity: product.quantity,
      notes: 'Initial stock',
    });
  }

  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<{
    name: string;
    category_id: string | null;
    capacity: number;
    price: number;
    quantity: number;
    supplier: string | null;
  }>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, categories(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function addStock(productId: string, quantity: number, notes?: string): Promise<void> {
  // Get current product
  const product = await getProductById(productId);

  // Update product quantity
  await supabase
    .from('products')
    .update({
      quantity: product.quantity + quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  // Log the transaction
  await supabase.from('transactions').insert({
    product_id: productId,
    type: 'add',
    quantity,
    notes: notes || 'Stock added',
  });
}

// ==================== CUSTOMERS ====================

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getCustomerById(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function addCustomer(customer: {
  name: string;
  phone: string | null;
  address: string | null;
}): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(
  id: string,
  updates: Partial<{ name: string; phone: string | null; address: string | null }>
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

export async function getCustomerSales(customerId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, products(*), customers(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ==================== SALES ====================

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, products(*), customers(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSaleById(id: string): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, products(*), customers(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function recordSale(sale: {
  product_id: string;
  customer_id: string;
  quantity: number;
  unit_price: number;
  payment_status: 'Paid' | 'Pending';
  notes?: string;
}): Promise<Sale> {
  // Get current product to check stock
  const product = await getProductById(sale.product_id);
  if (product.quantity < sale.quantity) {
    throw new Error(`Insufficient stock. Only ${product.quantity} available.`);
  }

  const total_amount = sale.quantity * sale.unit_price;

  // Create the sale record
  const { data, error } = await supabase
    .from('sales')
    .insert({
      ...sale,
      total_amount,
    })
    .select('*, products(*), customers(*)')
    .single();
  if (error) throw error;

  // Deduct stock from product
  await supabase
    .from('products')
    .update({
      quantity: product.quantity - sale.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sale.product_id);

  // Log the transaction
  await supabase.from('transactions').insert({
    product_id: sale.product_id,
    type: 'sold',
    quantity: sale.quantity,
    notes: `Sold to ${data.customers?.name || 'Unknown'}`,
  });

  return data;
}

export async function updateSalePaymentStatus(
  id: string,
  status: 'Paid' | 'Pending'
): Promise<void> {
  const { error } = await supabase
    .from('sales')
    .update({ payment_status: status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSale(id: string): Promise<void> {
  // Get the sale to restore stock
  const sale = await getSaleById(id);

  // Restore product stock if product still exists
  if (sale.product_id) {
    try {
      const product = await getProductById(sale.product_id);
      await supabase
        .from('products')
        .update({
          quantity: product.quantity + sale.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sale.product_id);
    } catch {
      // Product may have been deleted, skip stock restore
    }
  }

  // Delete related transactions
  await supabase
    .from('transactions')
    .delete()
    .eq('product_id', sale.product_id)
    .eq('type', 'sold')
    .eq('quantity', sale.quantity);

  // Delete the sale
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

// ==================== DAMAGED ====================

export async function getDamagedLogs(): Promise<DamagedLog[]> {
  const { data, error } = await supabase
    .from('damaged_logs')
    .select('*, products(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function recordDamaged(entry: {
  product_id: string;
  quantity: number;
  reason: string;
}): Promise<DamagedLog> {
  // Get current product to check stock
  const product = await getProductById(entry.product_id);
  if (product.quantity < entry.quantity) {
    throw new Error(`Insufficient stock. Only ${product.quantity} available.`);
  }

  // Create damaged log
  const { data, error } = await supabase
    .from('damaged_logs')
    .insert(entry)
    .select('*, products(*)')
    .single();
  if (error) throw error;

  // Deduct stock
  await supabase
    .from('products')
    .update({
      quantity: product.quantity - entry.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entry.product_id);

  // Log the transaction
  await supabase.from('transactions').insert({
    product_id: entry.product_id,
    type: 'damaged',
    quantity: entry.quantity,
    notes: entry.reason,
  });

  return data;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, products(*)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  // Total products in stock
  const { data: products } = await supabase
    .from('products')
    .select('quantity');
  const totalStock = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;
  const totalProducts = products?.length || 0;

  // Total items sold
  const { data: sales } = await supabase
    .from('sales')
    .select('quantity');
  const totalSold = sales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

  // Damaged items
  const { data: damaged } = await supabase
    .from('damaged_logs')
    .select('quantity');
  const totalDamaged = damaged?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;

  // Low stock count (products with quantity < 10)
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('*')
    .lt('quantity', 10);
  const lowStockCount = lowStockProducts?.length || 0;

  // Today's sales (local start of day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_amount, quantity')
    .gte('created_at', todayStart.toISOString());
  const todayRevenue = todaySales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
  const todaySoldCount = todaySales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

  // Pending payments
  const { data: pendingSales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('payment_status', 'Pending');
  const pendingAmount = pendingSales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    totalStock,
    totalProducts,
    totalSold,
    totalDamaged,
    lowStockCount,
    lowStockProducts: lowStockProducts || [],
    todayRevenue,
    todaySoldCount,
    pendingAmount,
    recentTransactions: recentTransactions || [],
  };
}

// ==================== REPORTS ====================

export async function getMonthlyReport(year: number, month: number) {
  // Use start of first day and end of last day of the month in local time
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data: monthlySales } = await supabase
    .from('sales')
    .select('*, products(name, categories(name))')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  const totalRevenue = monthlySales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
  const totalItems = monthlySales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
  const paidAmount = monthlySales
    ?.filter(s => s.payment_status === 'Paid')
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
  const pendingAmount = monthlySales
    ?.filter(s => s.payment_status === 'Pending')
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;

  // Group by product to find most sold
  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  monthlySales?.forEach(sale => {
    const pid = sale.product_id || 'unknown';
    if (!productMap[pid]) {
      productMap[pid] = {
        name: sale.products?.name || 'Unknown',
        quantity: 0,
        revenue: 0,
      };
    }
    productMap[pid].quantity += sale.quantity;
    productMap[pid].revenue += Number(sale.total_amount || 0);
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    sales: monthlySales || [],
    totalRevenue,
    totalItems,
    paidAmount,
    pendingAmount,
    topProducts,
  };
}

export async function getDailyReport(date: Date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const { data: dailySales } = await supabase
    .from('sales')
    .select('*, products(name), customers(name)')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  const totalRevenue = dailySales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
  const totalItems = dailySales?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

  return {
    sales: dailySales || [],
    totalRevenue,
    totalItems,
  };
}
