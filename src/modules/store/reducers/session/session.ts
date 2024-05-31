import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SessionState {
  id: number | null;
  name: string | null;
  studentId: string | null;
}

export const initialSessionState: SessionState = {
  id: null,
  name: null,
  studentId: null,
};

export const sessionSlice = createSlice({
  name: "session",
  initialState: initialSessionState,
  reducers: {
    setSessionData: (state, action: PayloadAction<SessionState>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.studentId = action.payload.studentId;
    },
  },
});

export const { setSessionData } = sessionSlice.actions;

export default sessionSlice.reducer;
