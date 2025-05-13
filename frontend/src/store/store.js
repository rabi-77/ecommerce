import { configureStore,combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/authSlice'
import adminAuth from  '../features/admin/adminAuth/adminAuthSlice'
import  categoryReducer from '../features/admin/adminCategory/adminCategoryslice'
import brandSlice from '../features/admin/adminBrand/brandSlice'
import productSlice from '../features/admin/adminProducts/productSlice'

import userProduct from '../features/userHomeSlice'
// storage.removeItem('persist:root');
const persistConfig = {
  key: 'root',
  storage,
  blacklist:['auth',"category","brand","product",'userProduct']
};

const rootReducer=combineReducers({
  auth:authReducer,
  adminAuth:adminAuth,
  category:categoryReducer,
  brand:brandSlice,
  product:productSlice,
  userProduct:userProduct
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