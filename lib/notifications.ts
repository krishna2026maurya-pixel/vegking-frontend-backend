import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { sendMail } from '@/lib/mail';
import { emitOrderStatusChanged } from '@/lib/socketClient';
import { sendPushNotification } from '@/lib/firebase';

interface StatusMessage {
  title: string;
  message: string;
  type: string;
}

const STATUS_MESSAGES: Record<string, StatusMessage> = {
  'Order Placed': {
    title: 'Order Placed Successfully',
    message: 'Your order has been placed successfully and is pending vendor confirmation.',
    type: 'new_order'
  },
  'Order Confirmed': {
    title: 'Order Confirmed',
    message: 'Good news! Your order has been accepted and confirmed by the vendor.',
    type: 'approved'
  },
  'Packing': {
    title: 'Preparing & Packing',
    message: 'The vendor is currently packing your fresh products for dispatch.',
    type: 'recurring_processed'
  },
  'Out for Delivery': {
    title: 'Out for Delivery',
    message: 'Your order is out for delivery! Our rider is on their way to your doorstep.',
    type: 'approved'
  },
  'Delivered': {
    title: 'Order Delivered',
    message: 'Your order has been delivered successfully. Thank you for shopping with VegKing!',
    type: 'approved'
  },
  'Cancelled': {
    title: 'Order Cancelled',
    message: 'Your order has been cancelled.',
    type: 'cancelled'
  }
};

export async function sendOrderStatusNotification(order: any, newStatus: string) {
  try {
    const statusConfig = STATUS_MESSAGES[newStatus] || {
      title: 'Order Status Updated',
      message: `Your order status has been updated to "${newStatus}".`,
      type: 'order_status'
    };

    const formattedMessage = statusConfig.message.replace('Your order', `Your order #${order.order_number}`);

    // 1. Save in-app notification in DB
    await Notification.create({
      userId: order.user_id,
      isAdmin: false,
      title: statusConfig.title,
      message: formattedMessage,
      type: statusConfig.type
    });

    // 2. Fetch User to send Email & FCM Push Notification
    const user = await User.findById(order.user_id).lean() as any;

    if (user && user.fiberbase_token) {
      await sendPushNotification(
        user.fiberbase_token,
        statusConfig.title,
        formattedMessage,
        {
          order_id: String(order._id),
          order_number: String(order.order_number),
          orderStatus: newStatus,
        }
      ).catch(err => {
        console.error(`Failed to send FCM push notification for order ${order._id}:`, err);
      });
    }

    if (user && user.email) {
      const subject = `VegKing Order #${order.order_number}: ${statusConfig.title}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fcfdfc;">
          <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="color: #1e3b2b; margin: 0;">VegKing Order Status Update</h2>
            <p style="color: #16a34a; font-size: 14px; margin: 5px 0 0 0;">Freshness Delivered Daily</p>
          </div>
          <p style="font-size: 16px; color: #1f2937;">Dear <strong>${user.name || 'Customer'}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
            ${formattedMessage}
          </p>
          <div style="background-color: #f4fbf7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #1e3b2b;">Order Details:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: bold; width: 120px;">Order Number:</td>
                <td style="padding: 4px 0; color: #1f2937;">#${order.order_number}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: bold;">New Status:</td>
                <td style="padding: 4px 0; color: #16a34a; font-weight: bold;">${newStatus}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: bold;">Total Amount:</td>
                <td style="padding: 4px 0; color: #1f2937;">₹${(order.total_amount || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 25px;">
            To track your order details, please log in to your account at <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/orders" style="color: #16a34a; text-decoration: none; font-weight: bold;">VegKing Orders</a>.
          </p>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 13px; color: #9ca3af; text-align: center;">
            <p style="margin: 0;">VegKing Inc. &bull; Fresh & Healthy Partners</p>
            <p style="margin: 5px 0 0 0;">This is an automated notification. Please do not reply directly to this message.</p>
          </div>
        </div>
      `;
      const emailText = `Dear ${user.name || 'Customer'},\n\n${formattedMessage}\n\nOrder Number: #${order.order_number}\nNew Status: ${newStatus}\nTotal Amount: ₹${(order.total_amount || 0).toFixed(2)}\n\nTrack your order at: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/orders`;
      
      await sendMail({
        to: user.email,
        subject,
        text: emailText,
        html: emailHtml
      }).catch(err => {
        console.error(`Failed to send order status email for order ${order._id}:`, err);
      });
    }

    // 3. Emit Socket.IO event for real-time dashboard updates
    emitOrderStatusChanged({
      order_id: order._id,
      order_number: order.order_number,
      orderStatus: newStatus,
      status: order.status,
      updatedBy: order.updatedBy || 'vendor'
    });
  } catch (error) {
    console.error('Failed to send order status notification:', error);
  }
}
