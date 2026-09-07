import Notification from '@/lib/models/Notification';
import Vendor from '@/lib/models/Vendor';
import Product from '@/lib/models/Product';
import { sendPushNotification } from '@/lib/firebase';
import mongoose from 'mongoose';

/**
 * Triggers real-time notifications for Admin and Vendors when a new order is placed with full message details.
 */
export async function notifyNewOrder(order: any, items: any[] = []) {
  try {
    const custName = order.customer_name || 'Customer';
    const addressPhone = typeof order.shippingAddress === 'object' ? order.shippingAddress?.phone : '';
    const custPhone = order.customer_mobile || addressPhone || '';
    const amount = Number(order.total_amount || 0).toLocaleString('en-IN');
    const orderNum = order.order_number || String(order._id).slice(-6);
    const payMethod = order.payment_method || 'COD';
    const city = typeof order.shippingAddress === 'object' 
      ? (order.shippingAddress?.city || '') 
      : (typeof order.shippingAddress === 'string' ? order.shippingAddress : '');

    // Resolve order items if not provided or only IDs
    let resolvedItems = items;
    if (!resolvedItems || resolvedItems.length === 0 || mongoose.isValidObjectId(resolvedItems[0])) {
      const OrderItem = (await import('@/lib/models/OrderItem')).default;
      if (order.items && order.items.length > 0) {
        resolvedItems = await OrderItem.find({ _id: { $in: order.items } }).lean();
      }
      if (!resolvedItems || resolvedItems.length === 0) {
        resolvedItems = await OrderItem.find({ order_id: order._id }).lean();
      }
    }

    // Generate readable items summary
    let itemsSummary = '';
    if (resolvedItems && resolvedItems.length > 0) {
      const names = resolvedItems.slice(0, 2).map((it: any) => it.name || it.product_name).filter(Boolean);
      itemsSummary = names.join(', ');
      if (resolvedItems.length > 2) {
        itemsSummary += ` +${resolvedItems.length - 2} more`;
      }
    }

    const fullMessage = `Order #${orderNum} placed by ${custName}${custPhone ? ` (${custPhone})` : ''} for ₹${amount} via ${payMethod}.${itemsSummary ? ` Items: ${itemsSummary}.` : ''}${city ? ` Delivery to: ${city}.` : ''}`;

    // 1. Create Admin Notification (Admin sees ALL orders)
    const adminNotif = await Notification.create({
      isAdmin: true,
      title: `New Order Placed: #${orderNum}`,
      message: fullMessage,
      type: 'new_order',
      link: `/admin/orders`,
      isRead: false,
    });

    // Firebase Push Notification for Admin
    try {
      await sendPushNotification(
        'admin_alerts_topic',
        `New Order #${orderNum}`,
        fullMessage,
        { order_id: String(order._id), type: 'new_order' }
      );
    } catch {
      // Firebase fallback safe
    }

    // 2. Identify all unique vendors from order items
    const vendorMap = new Map<string, string[]>();

    for (const it of (resolvedItems || [])) {
      let vId = it.vendor_id || null;
      const itName = it.name || it.product_name || 'Item';

      // If vendor_id is not directly on OrderItem, lookup from Product
      if (!vId && (it.productId || it.product_id)) {
        const pId = it.productId || it.product_id;
        if (mongoose.isValidObjectId(pId)) {
          const prod = await Product.findById(pId).select('vendor_id product_name').lean() as any;
          if (prod?.vendor_id) {
            vId = prod.vendor_id;
          }
        }
      }

      if (vId && mongoose.isValidObjectId(vId)) {
        const idStr = String(vId);
        const existing = vendorMap.get(idStr) || [];
        existing.push(itName);
        vendorMap.set(idStr, existing);
      }
    }

    // Notify each specific vendor whose products were ordered
    for (const [vId, prodNames] of Array.from(vendorMap.entries())) {
      const vendorMessage = `Order #${orderNum} received for your items: ${prodNames.slice(0, 3).join(', ')}. Customer: ${custName}. Please review and prepare dispatch.`;

      await Notification.create({
        vendor_id: new mongoose.Types.ObjectId(vId),
        isAdmin: false,
        title: `New Order for Your Shop! #${orderNum}`,
        message: vendorMessage,
        type: 'new_order',
        link: `/vendor/dashboard`,
        isRead: false,
      });

      // Firebase FCM Push for vendor device
      try {
        const vendor = await Vendor.findById(vId).select('fiberbase_token').lean() as any;
        if (vendor?.fiberbase_token) {
          await sendPushNotification(
            vendor.fiberbase_token,
            `New Order Received #${orderNum}`,
            vendorMessage,
            { order_id: String(order._id), type: 'new_order' }
          );
        }
      } catch {
        // FCM safe catch
      }
    }

    return { success: true, adminNotifId: adminNotif._id };
  } catch (error) {
    console.error('Error notifying new order:', error);
    return { success: false, error };
  }
}

/**
 * Automatically detects and syncs orders from MongoDB that do not have notifications yet
 * (e.g. orders placed on Vercel deployment or external webhooks).
 */
export async function syncMissingOrderNotifications() {
  try {
    const Order = (await import('@/lib/models/Order')).default;
    const OrderItem = (await import('@/lib/models/OrderItem')).default;

    // Check recent orders from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentOrders = await Order.find({ createdAt: { $gt: twoHoursAgo } })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    if (!recentOrders || recentOrders.length === 0) return;

    for (const order of recentOrders) {
      const orderNum = order.order_number || String(order._id).slice(-6);

      // Check if notification already exists in MongoDB for this order
      const existingNotif = await Notification.findOne({
        $or: [
          { message: { $regex: orderNum } },
          { title: { $regex: orderNum } }
        ]
      }).select('_id').lean();

      if (!existingNotif) {
        // Fetch order items
        let items: any[] = [];
        if (order.items && order.items.length > 0) {
          items = await OrderItem.find({ _id: { $in: order.items } }).lean();
        }
        if (!items || items.length === 0) {
          items = await OrderItem.find({ order_id: order._id }).lean();
        }

        console.log(`[REALTIME SYNC] Auto-generating notification for order #${orderNum}`);
        await notifyNewOrder(order, items);
      }
    }
  } catch (err) {
    console.error('[REALTIME SYNC ERROR]:', err);
  }
}

/**
 * Triggers real-time notification for Admin when a new Customer registers.
 */
export async function notifyNewUserRegistration(user: any) {
  try {
    const name = user.name || 'New Customer';
    const mobile = user.mobile_no || user.mobile_number || 'No phone';
    const email = user.email || 'No email';
    const city = user.city || '';

    const fullMessage = `New customer registered: ${name} (Phone: ${mobile}, Email: ${email})${city ? ` from ${city}` : ''}. Account is active.`;

    const adminNotif = await Notification.create({
      isAdmin: true,
      title: `New Customer Registration: ${name}`,
      message: fullMessage,
      type: 'user_registered',
      link: `/admin/users`,
      isRead: false,
    });

    try {
      await sendPushNotification(
        'admin_alerts_topic',
        `New User Registration`,
        fullMessage,
        { user_id: String(user._id || ''), type: 'user_registered' }
      );
    } catch {}

    return { success: true, adminNotifId: adminNotif._id };
  } catch (error) {
    console.error('Error notifying user registration:', error);
    return { success: false, error };
  }
}

/**
 * Triggers real-time notification for Admin when a new Vendor registers.
 */
export async function notifyNewVendorRegistration(vendor: any) {
  try {
    const shopName = vendor.shop_name || 'New Shop';
    const owner = vendor.full_name || 'Vendor';
    const mobile = vendor.mobile_number || vendor.mobile_no || 'No mobile';
    const city = vendor.city || 'N/A';

    const fullMessage = `New vendor registered: "${shopName}" owned by ${owner}. Phone: ${mobile}, Location: ${city}. Waiting for verification.`;

    const adminNotif = await Notification.create({
      isAdmin: true,
      title: `New Vendor Registered: ${shopName}`,
      message: fullMessage,
      type: 'vendor_application',
      link: `/admin/vendors`,
      isRead: false,
    });

    try {
      await sendPushNotification(
        'admin_alerts_topic',
        `New Vendor Registered`,
        fullMessage,
        { vendor_id: String(vendor._id || ''), type: 'vendor_application' }
      );
    } catch {}

    return { success: true, adminNotifId: adminNotif._id };
  } catch (error) {
    console.error('Error notifying vendor registration:', error);
    return { success: false, error };
  }
}

/**
 * Triggers real-time notifications for Admin and Vendor when a product is added with full details.
 */
export async function notifyProductAdded(product: any, actorName: string = 'Admin') {
  try {
    const prodName = product.product_name || 'New Product';
    const stock = product.stock ?? 0;
    const price = product.selling_price ? `₹${product.selling_price}` : '';
    const category = product.category || 'General';
    const vendorShop = product.vendor_shop_name || 'Direct / Admin';

    const fullMessage = `Product: "${prodName}" (${category}) added with ${stock} in stock at ${price}. Shop: ${vendorShop} (Added by ${actorName}).`;

    // 1. Notify Admin
    const adminNotif = await Notification.create({
      isAdmin: true,
      title: `Product Added: ${prodName}`,
      message: fullMessage,
      type: 'product_created',
      link: `/admin/products`,
      isRead: false,
    });

    // 2. If assigned to a vendor, notify the vendor
    if (product.vendor_id && mongoose.isValidObjectId(product.vendor_id)) {
      const vendorMessage = `Your product "${prodName}" is now active in store with ${stock} units stock at ${price}.`;

      await Notification.create({
        vendor_id: new mongoose.Types.ObjectId(product.vendor_id),
        isAdmin: false,
        title: `Product Published: ${prodName}`,
        message: vendorMessage,
        type: 'product_created',
        link: `/vendor/dashboard`,
        isRead: false,
      });

      // Firebase Push for vendor
      try {
        const vendor = await Vendor.findById(product.vendor_id).select('fiberbase_token').lean() as any;
        if (vendor?.fiberbase_token) {
          await sendPushNotification(
            vendor.fiberbase_token,
            `Product Published: ${prodName}`,
            vendorMessage,
            { product_id: String(product._id), type: 'product_created' }
          );
        }
      } catch {}
    }

    return { success: true, adminNotifId: adminNotif._id };
  } catch (error) {
    console.error('Error notifying product added:', error);
    return { success: false, error };
  }
}

/**
 * Triggers real-time notifications for Admin and Vendor when a product is updated (stock, price, etc.)
 */
export async function notifyProductUpdated(product: any, actorName: string = 'Admin') {
  try {
    const prodName = product.product_name || 'Product';
    const stock = product.stock ?? 0;
    const price = product.selling_price ? `₹${product.selling_price}` : '';
    const vendorShop = product.vendor_shop_name || 'Direct / Admin';

    const fullMessage = `Product "${prodName}" updated: stock is now ${stock}${price ? `, price ${price}` : ''}. Shop: ${vendorShop} (Updated by ${actorName}).`;

    // 1. Notify Admin (Admin sees ALL product updates)
    const adminNotif = await Notification.create({
      isAdmin: true,
      title: `Product Updated: ${prodName}`,
      message: fullMessage,
      type: 'product_updated',
      link: `/admin/products`,
      isRead: false,
    });

    // 2. If assigned to a vendor, ONLY notify THAT vendor
    if (product.vendor_id && mongoose.isValidObjectId(product.vendor_id)) {
      const vendorMessage = `Your product "${prodName}" was updated: current stock is ${stock}${price ? `, price ${price}` : ''}.`;

      await Notification.create({
        vendor_id: new mongoose.Types.ObjectId(product.vendor_id),
        isAdmin: false,
        title: `Product Updated: ${prodName}`,
        message: vendorMessage,
        type: 'product_updated',
        link: `/vendor/dashboard`,
        isRead: false,
      });

      try {
        const vendor = await Vendor.findById(product.vendor_id).select('fiberbase_token').lean() as any;
        if (vendor?.fiberbase_token) {
          await sendPushNotification(
            vendor.fiberbase_token,
            `Product Updated: ${prodName}`,
            vendorMessage,
            { product_id: String(product._id), type: 'product_updated' }
          );
        }
      } catch {}
    }

    return { success: true, adminNotifId: adminNotif._id };
  } catch (error) {
    console.error('Error notifying product update:', error);
    return { success: false, error };
  }
}

