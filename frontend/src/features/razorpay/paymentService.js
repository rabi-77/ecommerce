import api from '../../apis/user/api'

export const createRazorpayOrder = async (orderData) => {
    try {
        const response = await api.post('/create-order', orderData);
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const verifyPayment = async (paymentData) => {
    try {
        const response = await api.post('/verify-payment', paymentData);
        
        return response.data;
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};

export const gerRazorPayKey = async () => {
    try {
        const response = await api.get('/razorpay-key');
        return response.data;
    } catch (error) {
        console.error('Error getting RazorPay key:', error);
        throw error;
    }
};