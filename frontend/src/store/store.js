import { configureStore,combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/authSlice'
import adminAuth from  '../features/admin/adminAuth/adminAuthSlice'
import  categoryReducer from '../features/admin/adminCategory/adminCategoryslice'
import brandSlice from '../features/admin/adminBrand/brandSlice'
import productSlice from '../features/admin/adminProducts/productSlice'
import adminUsersReducer from '../features/admin/adminUsers/userSlice'
import profileReducer from '../features/userprofile/profileSlice'
import addressReducer from '../features/userAddress/addressSlice'
import changeEmailReducer from '../features/changeEmail/changeEmailSlice'
import changePasswordReducer from '../features/changePassword/changePasswordSlice'
import wishlistReducer from '../features/wishlist/wishlistSlice'
import cartReducer from '../features/cart/cartSlice'
import orderReducer from '../features/order/orderSlice'


import userProduct from '../features/userHomeSlice'
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
  profile:profileReducer,
  address:addressReducer,
  changeEmail:changeEmailReducer,
  changePassword:changePasswordReducer,
  wishlist:wishlistReducer,
  cart:cartReducer,
  order:orderReducer
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