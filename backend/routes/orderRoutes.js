import express from 'express';
const router = express.Router();
import { 
  createOrder, 
  getOrderById, 
  getMyOrders, 
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  returnOrderItem,
  generateInvoice
} from '../controllers/orderController.js';
import { verifyToken } from '../middlewares/auth.js';
import { authenticateUser, userAuthorization } from '../middlewares/user/authenticateUser.js';

// User routes
router.route('/')
  .post(verifyToken, authenticateUser, userAuthorization, createOrder)
  .get(async(req,res,next)=>{
    console.log('lollll');
    next()
  },verifyToken, authenticateUser, userAuthorization, getMyOrders);

router.route('/:id')
  .get(verifyToken, authenticateUser, userAuthorization, getOrderById);

router.route('/:id/cancel')
  .put(verifyToken, authenticateUser, userAuthorization, cancelOrder);

router.route('/:id/items/:itemId/cancel')
  .put(verifyToken, authenticateUser, userAuthorization, cancelOrderItem);

router.route('/:id/return')
  .put(verifyToken, authenticateUser, userAuthorization, returnOrder);

router.route('/:id/items/:itemId/return')
  .put(verifyToken, authenticateUser, userAuthorization, returnOrderItem);

router.route('/:id/invoice')
  .get(verifyToken, authenticateUser, userAuthorization, generateInvoice);

export default router;
