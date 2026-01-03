import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import User, { IUser } from '../models/User';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import Logger from '../utils/logger';

const router = Router();

// --- Helper: Generate SHA512 Hash ---
const generateHash = (data: string): string => {
  return crypto.createHash('sha512').update(data).digest('hex');
};

/**
 * @route   POST /api/payment/create-order
 * @desc    Create an Easebuzz payment request
 * @access  Private
 */
router.post('/create-order', authMiddleware, async (req: Request, res: Response) => {
  const { amount_float, productinfo } = req.body; // e.g., amount_float: 100.0, productinfo: "Premium Subscription"
  const user = req.user as IUser;

  // Get credentials from .env
  const { EASEBUZZ_KEY, EASEBUZZ_SALT, EASEBUZZ_ENV, APP_BASE_URL } = process.env;

  if (!EASEBUZZ_KEY || !EASEBUZZ_SALT || !EASEBUZZ_ENV || !APP_BASE_URL) {
    return res.status(500).json({ message: 'Payment gateway not configured' });
  }

  // Validate amount
  if (typeof amount_float !== 'number' || amount_float <= 0 || isNaN(amount_float)) {
    return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
  }

  // Easebuzz requires a unique transaction ID
  const txnid = `BLUR-${nanoid(10)}`;
  const amount = amount_float.toFixed(2);
  const firstname = user.email.split('@')[0]; // Use part of email as name
  const email = user.email;
  const phone = '9999999999'; // Easebuzz requires a phone number. Use a placeholder for now.
  const surl = `${APP_BASE_URL}/#/payment/callback`; // Success URL
  const furl = `${APP_BASE_URL}/#/payment/callback`; // Failure URL (same page, handles both)
  
  // We will pass the userID in udf1 to identify the user on callback
  const udf1 = user.id;

  // Create the hash string in the correct sequence
  const hashString = `${EASEBUZZ_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|||||||||${EASEBUZZ_SALT}`;
  const hash = generateHash(hashString);

  // Data to be sent to Easebuzz
  const paymentData = {
    key: EASEBUZZ_KEY,
    txnid: txnid,
    amount: amount,
    productinfo: productinfo,
    firstname: firstname,
    email: email,
    phone: phone,
    surl: surl,
    furl: furl,
    udf1: udf1,
    hash: hash,
  };

  // Select the correct API endpoint based on environment
  const payment_api_url = EASEBUZZ_ENV === 'test' 
    ? 'https://testpay.easebuzz.in/payment/initiateLink'
    : 'https://pay.easebuzz.in/payment/initiateLink';

  try {
    const response = await fetch(payment_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentData),
    });

    const jsonResponse = await response.json();

    if (jsonResponse.status === 1) {
      // Send the 'access_key' (the 'data' field) to the client
      // The client will use this to open the payment modal
      res.status(200).json({ access_key: jsonResponse.data });
    } else {
      res.status(400).json({ message: jsonResponse.msg || 'Failed to create order' });
    }
  } catch (error) {
    Logger.error('Easebuzz Create Order Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   POST /api/payment/verify-payment
 * @desc    Verify payment callback from Easebuzz
 * @access  Public (called by client, which gets data from Easebuzz redirect)
 */
router.post('/verify-payment', async (req: Request, res: Response) => {
  // The client will send the full response body from Easebuzz here
  const { status, txnid, amount, productinfo, firstname, email, udf1, hash } = req.body;
  
  const { EASEBUZZ_KEY, EASEBUZZ_SALT } = process.env;

  if (!EASEBUZZ_SALT) {
    return res.status(500).json({ message: 'Payment gateway not configured' });
  }

  // --- Verify the Hash ---
  // The response hash sequence is:
  // salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  // We only used udf1, so the others are empty strings.
  const hashString = `${EASEBUZZ_SALT}|${status}|||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${EASEBUZZ_KEY}`;
  const calculatedHash = generateHash(hashString);

  if (hash !== calculatedHash) {
    return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid hash' });
  }

  // --- Hash is valid, check payment status ---
  if (status === 'success') {
    try {
      // Find the user from udf1 and upgrade them
      const userId = udf1;
      const user = await User.findById(userId);
      
      if (user) {
        user.isPremium = true;
        await user.save();
        Logger.info(`User ${user.email} upgraded to Premium.`);
        return res.status(200).json({ success: true, message: 'Payment successful! You are now a Premium user.' });
      } else {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    } catch (error) {
      Logger.error('Error updating user to premium:', error);
      return res.status(500).json({ success: false, message: 'Server error during verification' });
    }
  } else {
    // status is 'failure' or 'pending'
    return res.status(200).json({ success: false, message: `Payment ${status}` });
  }
});

export default router;