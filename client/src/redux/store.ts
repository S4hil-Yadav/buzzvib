import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import postDraftReducer from "@/redux/slices/postDraftSlice";
import alertReducer from "@/redux/slices/alertSlice";
import themeReducer from "@/redux/slices/themeSlice";

const persistConfig = {
  key: "root",
  storage,
  version: 1,
  blacklist: ["alert"],
};

const postDraftConfig = {
  key: "postDraft",
  storage,
  whitelist: ["postDraft"],
};

const rootReducer = combineReducers({
  theme: themeReducer,
  alert: alertReducer,
  postDraft: persistReducer(postDraftConfig, postDraftReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
