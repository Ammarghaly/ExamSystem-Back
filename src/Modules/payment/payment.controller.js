import express from 'express';
import { createSubscriptionIntent,stripePublishableKey, createAddonIntent } from './payment.service.js';
import { authentication } from '../../Middelwares/auth.middlewares.js';

const router = express.Router();
router.post('/create-subscription-intent', authentication, createSubscriptionIntent);
router.post('/create-addon-intent', authentication, createAddonIntent);
router.get('/config', stripePublishableKey);

export default router;