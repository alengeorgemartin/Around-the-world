import React, { useState } from 'react';
import { CreditCard, QrCode, X, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import '../styles/PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');

    // UPI State
    const [upiId, setUpiId] = useState('');

    if (!isOpen || !booking) return null;

    // Formatting Helpers
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardNumber(formatted.substring(0, 19));
    };

    const handleExpiryChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            setExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
        } else {
            setExpiry(val);
        }
    };

    const handleCvvChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        setCvv(val.substring(0, 4));
    };

    const simulatePayment = () => {
        // Validation
        if (paymentMethod === 'card') {
            if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3 || !name.trim()) {
                alert("Please fill in all card details correctly.");
                return;
            }
        } else if (paymentMethod === 'upi') {
            if (!upiId.includes('@')) {
                alert("Please enter a valid UPI ID (e.g., user@okaxis).");
                return;
            }
        }

        setIsProcessing(true);

        // Simulate network request
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);

            // Call success handler after showing success animation
            setTimeout(() => {
                onSuccess(booking._id);
                setIsSuccess(false); // Reset for next time
                setCardNumber('');
                setExpiry('');
                setCvv('');
                setName('');
                setUpiId('');
            }, 2000);
        }, 2500);
    };

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="payment-modal-header">
                    <div className="header-title">
                        <h2>Complete Payment</h2>
                        <span className="secure-badge">
                            <ShieldCheck size={14} /> Secure Checkout
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose} disabled={isProcessing || isSuccess}>
                        <X size={24} />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="payment-success-view">
                        <div className="success-icon-container">
                            <CheckCircle size={80} className="success-icon" />
                        </div>
                        <h3>Payment Successful!</h3>
                        <p>Your booking has been fully paid for and is completed.</p>
                        <p className="reference-id">Ref ID: TXN_SIM_{Math.floor(Math.random() * 1000000)}</p>
                    </div>
                ) : (
                    <>
                        {/* Order Summary */}
                        <div className="order-summary">
                            <div className="summary-row">
                                <span>Booking Type</span>
                                <strong className="capitalize">{booking.bookingType}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Total Amount to Pay</span>
                                <strong className="amount">₹{booking.totalPrice?.toLocaleString() || 0}</strong>
                            </div>
                        </div>

                        {/* Payment Method Tabs */}
                        <div className="payment-methods">
                            <button
                                className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                                disabled={isProcessing}
                            >
                                <CreditCard size={18} /> Card
                            </button>
                            <button
                                className={`method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('upi')}
                                disabled={isProcessing}
                            >
                                <QrCode size={18} /> UPI / QR
                            </button>
                        </div>

                        {/* Form Area */}
                        <div className="payment-form-area">
                            {paymentMethod === 'card' ? (
                                <div className="card-form animate-fade-in">
                                    <div className="form-group">
                                        <label>Card Number</label>
                                        <div className="input-with-icon">
                                            <CreditCard size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={handleCardNumberChange}
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Expiry (MM/YY)</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={expiry}
                                                onChange={handleExpiryChange}
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>CVV</label>
                                            <input
                                                type="password"
                                                placeholder="123"
                                                value={cvv}
                                                onChange={handleCvvChange}
                                                maxLength="4"
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Cardholder Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="upi-form animate-fade-in">
                                    <div className="qr-container">
                                        <img
                                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=simulate@payment&pn=AI%20Travel%20Planner&cu=INR"
                                            alt="Scan to Pay"
                                            className="qr-image"
                                        />
                                        <p>Scan with any UPI App</p>
                                    </div>

                                    <div className="divider"><span>OR</span></div>

                                    <div className="form-group">
                                        <label>Enter UPI ID</label>
                                        <div className="input-with-icon">
                                            <span className="input-prefix">@</span>
                                            <input
                                                type="text"
                                                placeholder="username@upi"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <button
                            className={`pay-action-btn ${isProcessing ? 'processing' : ''}`}
                            onClick={simulatePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={18} className="spin-icon" /> Processing...
                                </>
                            ) : (
                                <>Pay ₹{booking.totalPrice?.toLocaleString() || 0}</>
                            )}
                        </button>

                        <div className="test-mode-notice">
                            <p><strong>Note:</strong> This is a simulated transaction for a project. No real money will be deducted. Please use dummy data.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
