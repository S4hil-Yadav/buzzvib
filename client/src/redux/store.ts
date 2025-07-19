import { Action, combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import themeReducer from "@/redux/slices/themeSlice";
import postDraftReducer from "@/redux/slices/postDraftSlice";
import editPostReducer from "@/redux/slices/editPostSlice";
import alertReducer from "@/redux/slices/alertSlice";
import preferenceReducer from "@/redux/slices/preferenceSlice";

const persistConfig = {
  key: "root",
  storage,
  version: 1,
  whitelist: ["theme", "postDraft"],
};

const postDraftConfig = {
  key: "postDraft",
  storage,
  whitelist: ["postDraft"],
};

const appReducer = combineReducers({
  theme: themeReducer,
  alert: alertReducer,
  editPost: editPostReducer,
  postDraft: persistReducer(postDraftConfig, postDraftReducer),
  preference: preferenceReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: Action) => {
  if (action.type === "RESET_STORE") {
    storage.removeItem("persist:root");
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

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
