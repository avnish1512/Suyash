export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  capacity: number;
  price: number;
  quantity: number;
  supplier: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  categories?: Category;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  product_id: string | null;
  customer_id: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'Paid' | 'Pending';
  notes: string | null;
  created_at: string;
  // Joined fields
  products?: Product;
  customers?: Customer;
}

export interface Transaction {
  id: string;
  product_id: string | null;
  type: 'add' | 'sold' | 'damaged';
  quantity: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  products?: Product;
}

export interface DamagedLog {
  id: string;
  product_id: string | null;
  quantity: number;
  reason: string | null;
  created_at: string;
  // Joined fields
  products?: Product;
}
