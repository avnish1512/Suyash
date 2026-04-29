import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '600', fontSize: 18, color: '#0f172a' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-product"
          options={{ presentation: 'modal', title: 'Add Product' }}
        />
        <Stack.Screen
          name="edit-product"
          options={{ presentation: 'modal', title: 'Edit Product' }}
        />
        <Stack.Screen
          name="product-details"
          options={{ title: 'Product Details' }}
        />
        <Stack.Screen
          name="add-sale"
          options={{ presentation: 'modal', title: 'Record Sale' }}
        />
        <Stack.Screen
          name="sale-details"
          options={{ title: 'Sale Details' }}
        />
        <Stack.Screen
          name="add-customer"
          options={{ presentation: 'modal', title: 'Add Customer' }}
        />
        <Stack.Screen
          name="customer-details"
          options={{ title: 'Customer Details' }}
        />
        <Stack.Screen
          name="add-damaged"
          options={{ presentation: 'modal', title: 'Report Damaged' }}
        />
        <Stack.Screen
          name="add-stock"
          options={{ presentation: 'modal', title: 'Add Stock' }}
        />
        <Stack.Screen
          name="add-category"
          options={{ presentation: 'modal', title: 'Manage Categories' }}
        />
        <Stack.Screen
          name="edit-customer"
          options={{ presentation: 'modal', title: 'Edit Customer' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
