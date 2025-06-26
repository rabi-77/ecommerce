import { configureStore,combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/authSlice'
import adminAuth from  '../features/admin/adminAuth/adminAuthSlice'
import  categoryReducer from '../features/admin/adminCategory/adminCategoryslice'
import brandSlice from '../features/admin/adminBrand/brandSlice'
import productSlice from '../features/admin/adminProducts/productSlice'
import adminUsersReducer from '../features/admin/adminUsers/userSlice'
import adminOrdersReducer from '../features/admin/adminOrders/adminOrderSlice'
import adminInventoryReducer from '../features/admin/adminInventory/adminInventorySlice'
import profileReducer from '../features/userprofile/profileSlice'
import addressReducer from '../features/userAddress/addressSlice'
import changeEmailReducer from '../features/changeEmail/changeEmailSlice'
import changePasswordReducer from '../features/changePassword/changePasswordSlice'
import wishlistReducer from '../features/wishlist/wishlistSlice'
import cartReducer from '../features/cart/cartSlice'
import orderReducer from '../features/order/orderSlice'
import paymentReducer from '../features/razorpay/paymentSlice'
import couponReducer from '../features/admin/adminCoupons/couponSlice'
import userProduct from '../features/userHomeSlice'
import walletReducer from '../features/wallet/walletSlice'
import offerReducer from '../features/admin/adminOffers/offerSlice'
import salesReportReducer from '../features/admin/salesReportSlice'
import dashboardReducer from '../features/admin/adminDashboard/dashboardSlice'
// storage.removeItem('persist:root');
const persistConfig = {
  key: 'root',
  storage,
  whitelist:['auth','adminAuth',]
};

const rootReducer=combineReducers({
  auth:authReducer,
  adminAuth:adminAuth,
  category:categoryReducer,
  brand:brandSlice,
  product:productSlice,
  userProduct:userProduct,
  adminUsers:adminUsersReducer,
  adminOrders:adminOrdersReducer,
  adminInventory:adminInventoryReducer,
  profile:profileReducer,
  address:addressReducer,
  changeEmail:changeEmailReducer,
  changePassword:changePasswordReducer,
  wishlist:wishlistReducer,
  cart:cartReducer,
  order:orderReducer,
  payment:paymentReducer,
  coupons:couponReducer,
  wallet:walletReducer,
  offers:offerReducer,
  salesReport:salesReportReducer,
  adminDashboard:dashboardReducer
})

const persistedReducer = persistReducer(persistConfig,rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);