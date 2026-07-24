'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Play, Pause, Edit2, Trash2, ShoppingBag, PlusCircle, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useAuth();
  const status = session ? 'authenticated' : 'unauthenticated';
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState(null);

  // Edit Subscription States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [editQty, setEditQty] = useState(1);
  const [editFreq, setEditFreq] = useState('weekly');
  const [editDeliveryDate, setEditDeliveryDate] = useState('Monday');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function fetchSubscriptions() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/subscription/user`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'user') {
      router.push(session?.user?.role === 'admin' ? '/admin' : '/vendor/dashboard');
    } else if (status === 'authenticated') {
      fetchSubscriptions();
    }
  }, [session, status, router]);

  // Edit Modal Opening Logic
  const openEditModal = (sub: any) => {
    setEditingSub(sub);
    setEditQty(sub.quantity);
    setEditFreq(sub.frequency);
    setEditDeliveryDate(sub.deliveryDate);
    setIsEditModalOpen(true);
  };



  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/subscription/update`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: editingSub._id,
          quantity: editQty,
          frequency: editFreq,
          deliveryDate: editDeliveryDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update subscription');
      }

      // Update the local state instantly
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === editingSub._id
            ? { ...sub, quantity: editQty, frequency: editFreq, deliveryDate: editDeliveryDate }
            : sub
        )
      );

      setIsEditModalOpen(false);
      alert('Subscription details updated successfully!');
    } catch (error: any) {
      alert(error.message || 'An error occurred while updating the subscription.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: any) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this subscription? This action cannot be undone.'
    );
    if (!confirmed) return;

    setUpdatingId(subscriptionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/subscription/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      // Update the local state instantly
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
        )
      );

      alert('Subscription has been cancelled successfully.');
    } catch (error: any) {
      alert(error.message || 'An error occurred while cancelling the subscription.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActionPlaceholder = (actionName: any, subscriptionId: any) => {
    alert(`${actionName} action is a placeholder for subscription: ${subscriptionId}. No advanced logic is executed yet.`);
  };

  const handlePauseResume = async (subscriptionId: any, currentStatus: any) => {
    const targetStatus = currentStatus === 'active' ? 'paused' : 'active';
    setUpdatingId(subscriptionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/subscription/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          status: targetStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update subscription status');
      }

      // Update the local state instantly
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === subscriptionId ? { ...sub, status: targetStatus } : sub
        )
      );
    } catch (error: any) {
      alert(error.message || 'An error occurred while updating the subscription.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getVerificationBadge = (vStatus: any) => {
    switch (vStatus?.toLowerCase()) {
      case 'verified':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Verification
          </span>
        );
    }
  };

  const getStatusBadge = (subStatus: any) => {
    switch (subStatus?.toLowerCase()) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-600 text-white rounded-full text-xs font-bold">
            Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold">
            Cancelled
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-600 text-white rounded-full text-xs font-bold">
            Paused
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-500 text-white rounded-full text-xs font-bold">
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading your subscriptions...</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
        <div className="bg-green-50 p-8 rounded-full mb-6 text-green-600">
          <Calendar className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Subscriptions</h1>
        <p className="text-gray-500 mb-8">
          You have no active subscriptions yet. Subscribe to your favorite wholesale organic produce for automated recurring delivery!
        </p>
        <button 
          onClick={() => router.push('/')} 
          className="w-full sm:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
        >
          Explore Wholesale Produce
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            My Subscriptions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your recurring wholesale organic deliveries</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="self-start sm:self-center flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-xl transition-colors text-sm"
        >
          <PlusCircle className="w-4 h-4" /> Subscribe to More
        </button>
      </div>

      <div className="space-y-6">
        {subscriptions.map((sub) => {
          const product = sub.productId || {};
          const fallbackImg = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=900&auto=format&fit=crop';
          const imageUrl = product.image || fallbackImg;

          const basePrice = (product.price || 0) * sub.quantity;
          const recurringPrice = Math.round(basePrice * (sub.frequency === 'weekly' ? 0.9 : 0.85));

          return (
            <div key={sub._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Header Info Panel */}
              <div className="p-6 md:p-8 flex flex-wrap justify-between items-center gap-4 bg-gray-50/40 border-b border-gray-100/50">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Frequency & Delivery</p>
                    <p className="font-extrabold text-gray-900 text-base capitalize">
                      {sub.frequency} Delivery ({sub.deliveryDate})
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {getVerificationBadge(sub.verificationStatus)}
                  {getStatusBadge(sub.status)}
                </div>
              </div>

              {/* Product Preview Body */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Image container */}
                  <div className="relative w-28 h-28 bg-white border border-gray-100 rounded-3xl overflow-hidden p-3 flex-shrink-0 flex items-center justify-center shadow-sm">
                    <img 
                      src={imageUrl} 
                      alt={product.name || 'Vegetable'} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow text-center sm:text-left space-y-2">
                    <h3 className="font-extrabold text-xl text-gray-900">
                      {product.name || 'Unknown Vegetable'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      High-quality organic wholesale selection.
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-y-2 gap-x-6 pt-2">
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume (Packs)</p>
                        <p className="font-bold text-gray-800 text-sm">{sub.quantity} pack(s)</p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Subscribed Date</p>
                        <p className="font-bold text-gray-800 text-sm">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Next Delivery</p>
                        <p className={`font-bold text-sm ${sub.nextDeliveryDate ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {sub.nextDeliveryDate
                            ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                            : 'Pending approval'
                          }
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Recurring Price</p>
                        <p className="font-extrabold text-green-600 text-sm">₹{recurringPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-100" />

                {/* Dashboard Action panel */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <span className="text-xs text-gray-400 font-medium">
                    ID: {sub._id}
                  </span>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      disabled={updatingId === sub._id || sub.status === 'cancelled'}
                      onClick={() => openEditModal(sub)}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm transition-all ${
                        updatingId === sub._id || sub.status === 'cancelled' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      disabled={updatingId === sub._id || sub.status === 'cancelled'}
                      onClick={() => handlePauseResume(sub._id, sub.status)}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm transition-all ${
                        updatingId === sub._id || sub.status === 'cancelled' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      {updatingId === sub._id ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                      ) : sub.status === 'active' ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
                      {updatingId === sub._id ? (
                        'Processing...'
                      ) : sub.status === 'active' ? (
                        'Pause'
                      ) : (
                        'Resume'
                      )}
                    </button>
                    <button 
                      disabled={updatingId === sub._id || sub.status === 'cancelled'}
                      onClick={() => handleCancelSubscription(sub._id)}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-all ${
                        updatingId === sub._id || sub.status === 'cancelled' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {/* Edit Subscription Modal */}
      {isEditModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full relative shadow-2xl border border-gray-100 flex flex-col gap-5 sm:gap-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsEditModalOpen(false)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
            >
              ×
            </button>
            
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">Edit Subscription</h3>
              <p className="text-gray-500 text-xs mt-1">Modify your recurring fresh delivery of {editingSub.productId?.name}</p>
            </div>

            {/* Product Preview */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
              <div className="relative w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden p-2 flex items-center justify-center flex-shrink-0">
                <img 
                  src={editingSub.productId?.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=900&auto=format&fit=crop'} 
                  alt={editingSub.productId?.name || 'Vegetable'} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{editingSub.productId?.name}</div>
                <div className="text-xs text-gray-400">Current Size: {editingSub.quantity} pack(s)</div>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity (Packs)</label>
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-1.5 self-start border border-gray-100">
                <button 
                  onClick={() => setEditQty(q => Math.max(1, q - 1))} 
                  className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-extrabold text-gray-900 text-base min-w-[24px] text-center">{editQty}</span>
                <button 
                  onClick={() => setEditQty(q => q + 1)} 
                  className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Frequency</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => {
                    setEditFreq('weekly');
                    setEditDeliveryDate('Monday');
                  }}
                  className={`border-2 rounded-2xl p-4 cursor-pointer text-center transition-all ${
                    editFreq === 'weekly' 
                      ? 'border-green-600 bg-green-50/50 shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-gray-900 text-sm">Weekly</div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Save 10% Extra</div>
                </div>
                <div 
                  onClick={() => {
                    setEditFreq('monthly');
                    setEditDeliveryDate('1st of the month');
                  }}
                  className={`border-2 rounded-2xl p-4 cursor-pointer text-center transition-all ${
                    editFreq === 'monthly' 
                      ? 'border-green-600 bg-green-50/50 shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-gray-900 text-sm">Monthly</div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Save 15% Extra</div>
                </div>
              </div>
            </div>

            {/* Preferred Delivery Day */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preferred Delivery Day / Date</label>
              <select
                value={editDeliveryDate}
                onChange={(e) => setEditDeliveryDate(e.target.value)}
                className="w-full p-4 text-sm font-medium border border-gray-100 rounded-2xl bg-gray-50 text-gray-800 outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer appearance-none"
              >
                {editFreq === 'weekly' ? (
                  <>
                    <option value="Monday">Monday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Friday">Friday</option>
                  </>
                ) : (
                  <>
                    <option value="1st of the month">1st of the month</option>
                    <option value="10th of the month">10th of the month</option>
                    <option value="20th of the month">20th of the month</option>
                  </>
                )}
              </select>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Base Price ({editQty} × ₹{editingSub.productId?.price || 0}):</span>
                <span className="font-bold text-gray-800">₹{(editingSub.productId?.price || 0) * editQty}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Discount ({editFreq === 'weekly' ? '10%' : '15%'}):</span>
                <span className="font-bold text-green-600">-₹{Math.round((editingSub.productId?.price || 0) * editQty * (editFreq === 'weekly' ? 0.1 : 0.15))}</span>
              </div>
              <hr className="border-dashed border-gray-200" />
              <div className="flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Recurring Price:</span>
                <span className="text-green-600">₹{Math.round((editingSub.productId?.price || 0) * editQty * (editFreq === 'weekly' ? 0.9 : 0.85))}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isSavingEdit}
              onClick={handleSaveEdit}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSavingEdit ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
