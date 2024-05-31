import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./reducers/session/session";

const store = configureStore({
  reducer: {
    session: sessionReducer,
  },
});

export type AppStore = typeof store;

export type RootState = ReturnType<AppStore["getState"]>;

export type AppDispatch = AppStore["dispatch"];

export default store;
