const Razorpay = require('razorpay');

// Fallback to the test keys provided by the user for immediate testing
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sz57RZmZviuRVh',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'xXesojF05toqSKoktZDaLhsi',
});

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, plan } = req.body;   // amount in paise (₹399 = 39900)

        const options = {
            amount: amount,           // in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: { plan: plan }
        };

        const order = await razorpay.orders.create(options);
        return res.status(200).json(order);
    } catch (error) {
        console.error('Razorpay Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
