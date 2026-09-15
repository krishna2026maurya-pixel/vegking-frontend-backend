import mongoose from 'mongoose';
import Product from '@/lib/models/Product';

export interface InventoryItem {
  productId?: string;
  _id?: string;
  product_id?: string;
  quantity?: number | string;
  qty?: number | string;
  cartQuantity?: number | string;
  is_bulk_deal?: boolean;
}

/**
 * Safely decrements product stock in MongoDB when an order is placed.
 * - Clamps stock at 0 (Math.max(0, currentStock - reqQty)) to prevent negative inventory.
 * - Dynamically updates stock_status to 0 (Out of Stock) when stock reaches 0.
 * - Decrements bulk_stock if item was ordered as a bulk deal.
 * - Returns an array of updated product records with their new stock and status.
 */
export async function decrementProductStock(items: InventoryItem[]) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }

  const updatedProducts = [];

  for (const item of items) {
    const rawId = item.productId || item.product_id || item._id;
    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      continue;
    }

    const reqQty = Number(item.quantity ?? item.qty ?? item.cartQuantity ?? 1);
    if (isNaN(reqQty) || reqQty <= 0) {
      continue;
    }

    const isBulk = Boolean(item.is_bulk_deal);

    try {
      const prod = await Product.findById(rawId);
      if (!prod) continue;

      // Handle bulk stock if applicable
      if (isBulk && prod.bulk_stock !== undefined && prod.bulk_stock !== null) {
        prod.bulk_stock = Math.max(0, Number(prod.bulk_stock) - reqQty);
      }

      // Handle standard product stock
      const currentStock = typeof prod.stock === 'number'
        ? prod.stock
        : (prod.stock !== undefined && prod.stock !== null && !isNaN(Number(prod.stock))
            ? Number(prod.stock)
            : 20);

      const newStock = Math.max(0, currentStock - reqQty);
      prod.stock = newStock;

      // Dynamically mark out of stock when limit is reached
      if (newStock === 0) {
        prod.stock_status = 0;
      }

      await prod.save();
      updatedProducts.push({
        _id: String(prod._id),
        product_name: prod.product_name,
        stock: newStock,
        stock_status: prod.stock_status,
      });
    } catch (err) {
      console.error(`[Inventory Error] Failed to decrement stock for product ${rawId}:`, err);
    }
  }

  return updatedProducts;
}

/**
 * Restores product stock when an order is cancelled or deleted.
 * - Increments product stock by returned quantity.
 * - Restores stock_status to 1 (In Stock) if it was previously marked out of stock.
 */
export async function restoreProductStock(items: InventoryItem[]) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }

  const restoredProducts = [];

  for (const item of items) {
    const rawId = item.productId || item.product_id || item._id;
    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      continue;
    }

    const reqQty = Number(item.quantity ?? item.qty ?? item.cartQuantity ?? 1);
    if (isNaN(reqQty) || reqQty <= 0) {
      continue;
    }

    const isBulk = Boolean(item.is_bulk_deal);

    try {
      const prod = await Product.findById(rawId);
      if (!prod) continue;

      if (isBulk && prod.bulk_stock !== undefined && prod.bulk_stock !== null) {
        prod.bulk_stock = Number(prod.bulk_stock) + reqQty;
      }

      const currentStock = typeof prod.stock === 'number'
        ? prod.stock
        : (prod.stock !== undefined && prod.stock !== null && !isNaN(Number(prod.stock))
            ? Number(prod.stock)
            : 0);

      const newStock = currentStock + reqQty;
      prod.stock = newStock;

      if (newStock > 0 && (prod.stock_status === 0 || prod.stock_status === '0')) {
        prod.stock_status = 1;
      }

      await prod.save();
      restoredProducts.push({
        _id: String(prod._id),
        product_name: prod.product_name,
        stock: newStock,
        stock_status: prod.stock_status,
      });
    } catch (err) {
      console.error(`[Inventory Error] Failed to restore stock for product ${rawId}:`, err);
    }
  }

  return restoredProducts;
}
