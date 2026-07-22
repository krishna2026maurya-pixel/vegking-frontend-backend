'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

const fallbackImage = '/images/product-card-default.jpg';

/* ── quantity options per vegetables type ─────────────────────── */
const quantityOptions = {
  cabbage:     ['400-500 g', '800 g-1 kg'],
  tomato:      ['500 g', '1 kg', '2 kg'],
  spinach:     ['1 Bunch', '2 Bunch'],
  carrot:      ['500 g', '1 kg'],
  eggplant:    ['500 g', '1 kg'],
  pepper:      ['250 g', '500 g'],
  broccoli:    ['1 Piece', '2 Piece'],
  onion:       ['500 g', '1 kg', '2 kg'],
  potato:      ['500 g', '1 kg', '2 kg'],
  cauliflower: ['1 Piece', '2 Piece'],
  arhar:       ['500 g', '1 kg', '2 kg'],
  chilli:      ['100 g', '250 g'],
  ginger:      ['100 g', '250 g'],
};

const defaultOptions = ['250 g', '500 g', '1 kg'];

/* ── helpers ─────────────────────────────────────────────────── */
function getVegetableType(name: any) {
  const v = name.toLowerCase();
  if (v.includes('tomato'))                             return 'tomato';
  if (v.includes('cabbage'))                            return 'cabbage';
  if (v.includes('spinach'))                            return 'spinach';
  if (v.includes('carrot'))                             return 'carrot';
  if (v.includes('eggplant') || v.includes('brinjal')) return 'eggplant';
  if (v.includes('pepper')   || v.includes('capsicum'))return 'pepper';
  if (v.includes('broccoli'))                           return 'broccoli';
  if (v.includes('onion'))                              return 'onion';
  if (v.includes('potato'))                             return 'potato';
  if (v.includes('cauliflower'))                        return 'cauliflower';
  if (v.includes('arhar') || v.includes('toor dal'))    return 'arhar';
  if (v.includes('chilli')   || v.includes('chili'))   return 'chilli';
  if (v.includes('ginger'))                             return 'ginger';
  return null;
}

function getQuantityOptions(name: any) {
  const type = getVegetableType(name);
  return type ? quantityOptions[type] : defaultOptions;
}

function parseQuantityRatio(qtyStr: any, baseQtyStr: any) {
  if (!qtyStr || !baseQtyStr) return 1;
  const parseToGrams = (s: any) => {
    // For ranges like "400-500 g", grab the first number
    const match = s.match(/(\d+)\s*(kg|g|piece|bunch)/i);
    if (!match) return null;
    let val = parseFloat(match[1]);
    let unit = match[2].toLowerCase();
    if (unit === 'kg') return val * 1000;
    return val;
  };
  const q1 = parseToGrams(qtyStr);
  const qBase = parseToGrams(baseQtyStr);
  if (q1 && qBase) {
    return q1 / qBase;
  }
  return 1;
}

/* Derive MRP from the stored selling price + discount saved on the product */
function calcPrices(price: any, discountPct: any) {
  const pct      = Number(discountPct) || 0;
  const yourPrice = Number(price);
  if (pct <= 0) return { yourPrice, mrp: null, saving: 0, pct: 0 };
  const mrp    = Math.round(yourPrice / (1 - pct / 100));
  const saving = mrp - yourPrice;
  return { yourPrice, mrp, saving, pct };
}

/* ── component ───────────────────────────────────────────────── */
export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const [imgSrc, setImgSrc]   = useState(product.image || fallbackImage);
  
  const hasWeightOptions = product.weightOptions && product.weightOptions.length > 0;
  const options = hasWeightOptions
    ? product.weightOptions.map((opt: any) => opt.weight)
    : getQuantityOptions(product.name || '');

  const [qty, setQty]         = useState(options[0] || '1 kg');
  
  const selectedOption = hasWeightOptions ? product.weightOptions.find((opt: any) => opt.weight === qty) : null;
  const multiplier = !hasWeightOptions ? parseQuantityRatio(qty, options[0]) : 1;
  const currentBasePrice = selectedOption ? selectedOption.price : Math.round(product.price * multiplier);

  const { yourPrice, mrp, saving, pct } = calcPrices(currentBasePrice, product.discount);
  const stockCount = Number(product.stock) || 0;
  const inStock = stockCount > 0;

  // Subscription states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subFreq, setSubFreq] = useState('weekly');
  const [subQty, setSubQty] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('Monday');
  
  // Add to cart click state
  const [cartClicked, setCartClicked] = useState(false);

  useEffect(() => {
    setDeliveryDate(subFreq === 'weekly' ? 'Monday' : '1st of the month');
  }, [subFreq]);

  useEffect(() => {
    setImgSrc(product.image || fallbackImage);
  }, [product.image]);

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: subQty,
          frequency: subFreq,
          deliveryDate: deliveryDate,
          selectedWeight: qty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Save locally as well
      const newSubscription = {
        id: data.subscription?._id || Date.now().toString(),
        productId: product._id,
        productName: product.name,
        image: imgSrc,
        size: qty,
        quantity: subQty,
        frequency: subFreq,
        deliveryDate: deliveryDate,
        price: data.chargedAmount ?? Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85)),
        createdAt: new Date().toISOString()
      };
      
      const existing = JSON.parse(localStorage.getItem('veggiemart_subscriptions') || '[]');
      existing.push(newSubscription);
      localStorage.setItem('veggiemart_subscriptions', JSON.stringify(existing));
      
      alert(`${data.message || `Successfully subscribed to ${product.name}!`} Wallet charged: Rs. ${Number(data.chargedAmount || newSubscription.price).toFixed(2)}.`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message === 'Insufficient Wallet Balance' ? 'Insufficient Wallet Balance' : `Subscription failed: ${err.message}`);
    }
  };

  return (
    <div style={styles.card}>
      {/* ── discount ribbon ──────────────────────────────────── */}
      {pct > 0 && (
        <div style={styles.ribbon}>{pct}% OFF</div>
      )}

      {/* ── product image ────────────────────────────────────── */}
      <Link href={`/product/${product._id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={styles.imageWrap}>
          <img
            src={imgSrc}
            alt={product.name}
            style={styles.image}
            onError={() => setImgSrc(fallbackImage)}
          />
        </div>
      </Link>

      {/* ── body ─────────────────────────────────────────────── */}
      <div style={styles.body}>
        {/* name */}
        <Link href={`/product/${product._id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <h3 style={styles.name}>
            {(product.name || '').length > 30 ? product.name.slice(0, 30) + '...' : product.name}
          </h3>
        </Link>

        {/* quantity dropdown row */}
        <div style={styles.qtyRow}>
          <select
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={styles.qtySelect}
          >
            {options.map((o: any) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <span style={inStock ? styles.greenDot : styles.grayDot} />
        </div>
        <div style={inStock ? styles.stockIn : styles.stockOut}>
          {inStock ? `${stockCount} in stock` : 'Out of stock'}
        </div>

        {/* price row */}
        <div style={styles.priceRow}>
          <span style={styles.yourPrice}>₹{yourPrice}</span>
          {pct > 0 && <span style={styles.yourPriceBadge}>your price</span>}
        </div>
        {mrp !== null && (
          <div style={styles.mrpRow}>
            <span style={styles.mrpLabel}>M.R.P </span>
            <span style={styles.mrp}>₹{mrp}</span>
            <span style={styles.discountNote}> ({pct}% off)</span>
          </div>
        )}

        {/* savings pill */}
        {saving > 0 && <div style={styles.savePill}>Save ₹{saving}</div>}

        {/* delivery area */}
        <button style={styles.deliveryLink}>Select delivery area</button>

        {/* divider */}
        <hr style={styles.divider} />

        {/* add to cart button */}
        <button
          onClick={() => {
            addToCart({ ...product, qty, price: yourPrice });
            setCartClicked(true);
            setTimeout(() => setCartClicked(false), 200);
          }}
          disabled={!inStock}
          style={{ 
            ...styles.subBtn, 
            ...(!inStock ? styles.disabledSubBtn : {}),
            ...(cartClicked ? { background: '#14532d', color: '#fff' } : {}) 
          }}
          onMouseEnter={(e) => {
            if (cartClicked) return;
            e.currentTarget.style.background = '#f4fbf7';
            e.currentTarget.style.color = '#15803d';
          }}
          onMouseLeave={(e) => {
            if (cartClicked) return;
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#16a34a';
          }}
        >
          {inStock ? (cartClicked ? 'Added!' : 'Add to Cart') : 'Out of Stock'}
        </button>

        {/* subscribe & save button */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!inStock}
          style={{ ...styles.subBtn, ...(!inStock ? styles.disabledSubBtn : {}) }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f4fbf7';
            e.currentTarget.style.color = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#16a34a';
          }}
        >
          Subscribe & Save
        </button>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={() => setIsModalOpen(false)} style={styles.modalClose}>×</button>
            <h3 style={styles.modalTitle}>Wholesale Subscription</h3>
            <p style={styles.modalSubtitle}>Set up recurring fresh deliveries of {product.name}</p>
            
            {/* Product preview */}
            <div style={styles.modalPreview}>
              <img src={imgSrc} alt={product.name} style={styles.modalPreviewImg} />
              <div>
                <div style={styles.modalPreviewName}>{product.name}</div>
                <div style={styles.modalPreviewSize}>Pack Size: {qty}</div>
                <div style={styles.modalPreviewPrice}>₹{yourPrice} / pack</div>
              </div>
            </div>

            {/* Quantity */}
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Quantity (Packs)</label>
              <div style={styles.qtyCounter}>
                <button onClick={() => setSubQty(q => Math.max(1, q - 1))} style={styles.counterBtn}>-</button>
                <span style={styles.counterValue}>{subQty}</span>
                <button onClick={() => setSubQty(q => q + 1)} style={styles.counterBtn}>+</button>
              </div>
            </div>

            {/* Frequency Cards */}
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Delivery Frequency</label>
              <div style={styles.freqContainer}>
                <div 
                  onClick={() => setSubFreq('weekly')}
                  style={{
                    ...styles.freqCard,
                    ...(subFreq === 'weekly' ? styles.freqCardActive : {})
                  }}
                >
                  <div style={styles.freqTitle}>Weekly</div>
                  <div style={styles.freqDiscount}>Save 10% Extra</div>
                </div>
                <div 
                  onClick={() => setSubFreq('monthly')}
                  style={{
                    ...styles.freqCard,
                    ...(subFreq === 'monthly' ? styles.freqCardActive : {})
                  }}
                >
                  <div style={styles.freqTitle}>Monthly</div>
                  <div style={styles.freqDiscount}>Save 15% Extra</div>
                </div>
              </div>
            </div>

            {/* Preferred Delivery Date */}
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Preferred Delivery Day / Date</label>
              <select
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={styles.modalSelect}
              >
                {subFreq === 'weekly' ? (
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

            {/* Subscription Summary */}
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Base Price ({subQty} x ₹{yourPrice}):</span>
                <span>₹{yourPrice * subQty}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Subscription Discount ({subFreq === 'weekly' ? '10%' : '15%'}):</span>
                <span style={{ color: '#16a34a' }}>-₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.1 : 0.15))}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '8px 0' }} />
              <div style={{ ...styles.summaryRow, fontWeight: '800', fontSize: '15px' }}>
                <span>Recurring Price:</span>
                <span style={{ color: '#16a34a' }}>₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85))}</span>
              </div>
            </div>

            {/* Confirm button */}
            <button onClick={handleSubscribe} style={styles.modalSubmitBtn}>
              Confirm Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── styles (inline to be self-contained) ────────────────────── */
const styles: any = {
  card: {
    position:      'relative',
    background:    '#fff',
    border:        '1px solid #e5e7eb',
    borderRadius:  '8px',
    overflow:      'hidden',
    display:       'flex',
    flexDirection: 'column',
    width:         '100%',
    maxWidth:      '220px',
    fontFamily:    "'Poppins', 'Segoe UI', sans-serif",
    boxShadow:     'none',
    transition:    'transform .2s ease',
  },

  /* red ribbon */
  ribbon: {
    position:   'absolute',
    top:        '10px',
    left:       '-2px',
    background: '#e53e3e',
    color:      '#fff',
    fontSize:   '11px',
    fontWeight: '700',
    padding:    '3px 8px 3px 6px',
    borderRadius: '0 3px 3px 0',
    letterSpacing: '.4px',
    zIndex:     10,
  },

  /* image */
  imageWrap: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#fff',
    padding:         '18px 16px 8px',
    height:          '140px',
  },
  image: {
    maxHeight:  '122px',
    maxWidth:   '145px',
    objectFit: 'contain',
  },

  /* body */
  body: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '8px 12px 0',
    gap:           '5px',
  },

  name: {
    fontSize:   '13px',
    fontWeight: '700',
    color:      '#1a1a1a',
    margin:     '0',
    lineHeight: '1.3',
  },

  /* quantity row */
  qtyRow: {
    display:     'flex',
    alignItems:  'center',
    gap:         '8px',
    marginTop:   '2px',
  },
  qtySelect: {
    flex:          1,
    padding:       '4px 7px',
    fontSize:      '12px',
    border:        '1px solid #d1d5db',
    borderRadius:  '4px',
    background:    '#fff',
    color:         '#374151',
    cursor:        'pointer',
    outline:       'none',
    appearance:    'auto',
  },
  greenDot: {
    width:        '12px',
    height:       '12px',
    borderRadius: '50%',
    background:   '#22c55e',
    flexShrink:   0,
    border:       '2px solid #16a34a',
  },
  grayDot: {
    width:        '12px',
    height:       '12px',
    borderRadius: '50%',
    background:   '#d1d5db',
    flexShrink:   0,
    border:       '2px solid #9ca3af',
  },
  stockIn: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803d',
  },
  stockOut: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#b91c1c',
  },

  /* price */
  priceRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    marginTop:  '2px',
  },
  yourPrice: {
    fontSize:   '16px',
    fontWeight: '800',
    color:      '#111827',
  },
  yourPriceBadge: {
    background:   '#16a34a',
    color:        '#fff',
    fontSize:     '10px',
    fontWeight:   '700',
    padding:      '2px 6px',
    borderRadius: '3px',
    letterSpacing: '.3px',
  },

  mrpRow: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  mrpLabel: {
    color: '#6b7280',
  },
  mrp: {
    textDecoration: 'line-through',
    color:          '#9ca3af',
  },
  discountNote: {
    color: '#6b7280',
  },

  /* savings pill */
  savePill: {
    display:      'inline-block',
    background:   '#f3f4f6',
    color:        '#374151',
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    alignSelf:    'flex-start',
    border:       '1px solid #e5e7eb',
  },

  /* delivery link */
  deliveryLink: {
    background:  'none',
    border:      'none',
    padding:     '0',
    fontSize:    '12px',
    color:       '#6b7280',
    cursor:      'pointer',
    textAlign:   'left',
    textDecoration: 'none',
    fontFamily:  'inherit',
  },

  divider: {
    border:     'none',
    borderTop:  '1px solid #f3f4f6',
    margin:     '4px 0 0',
  },

  /* add to cart */
  cartBtn: {
    width:        'calc(100% + 24px)',
    marginLeft:   '-12px',
    padding:      '11px 0',
    background:   '#16a34a',
    color:        '#ffffff',
    border:       'none',
    fontSize:     '13px',
    fontWeight:   '700',
    cursor:       'pointer',
    letterSpacing: '.3px',
    transition:   'background .15s ease',
  },
  subBtn: {
    width:        'calc(100% + 24px)',
    marginLeft:   '-12px',
    padding:      '10px 0',
    background:   'transparent',
    color:        '#16a34a',
    border:       'none',
    borderTop:    '1px solid #f3f4f6',
    fontSize:     '12px',
    fontWeight:   '700',
    cursor:       'pointer',
    letterSpacing: '.3px',
    transition:   'all .15s ease',
  },
  disabledBtn: {
    background: '#9ca3af',
    cursor: 'not-allowed',
  },
  disabledSubBtn: {
    color: '#9ca3af',
    cursor: 'not-allowed',
    background: '#f9fafb',
  },
  
  /* Modal Styles */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: 'none',
    border: '1px solid #e5e7eb',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '-8px 0 0',
  },
  modalPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #f3f4f6',
  },
  modalPreviewImg: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
  },
  modalPreviewName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  modalPreviewSize: {
    fontSize: '12px',
    color: '#6b7280',
  },
  modalPreviewPrice: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  modalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  modalLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'auto',
  },
  qtyCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    padding: '4px',
    alignSelf: 'flex-start',
  },
  counterBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    boxShadow: 'none',
    border: '1px solid #e5e7eb',
  },
  counterValue: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    minWidth: '20px',
    textAlign: 'center',
  },
  freqContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  freqCard: {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  freqCardActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f4fbf7',
  },
  freqTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
  },
  freqDiscount: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#16a34a',
    marginTop: '2px',
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #f3f4f6',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#4b5563',
    lineHeight: '1.6',
  },
  modalSubmitBtn: {
    width: '100%',
    padding: '14px 0',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
  },
};
