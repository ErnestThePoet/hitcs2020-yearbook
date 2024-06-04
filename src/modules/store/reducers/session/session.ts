import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SessionState {
  id: number | null;
  name: string | null;
  studentId: string | null;
  visitor: boolean;
}

export const initialSessionState: SessionState = {
  id: null,
  name: null,
  studentId: null,
  visitor: false,
};

export const sessionSlice = createSlice({
  name: "session",
  initialState: initialSessionState,
  reducers: {
    setVisitor: (state, action: PayloadAction<boolean>) => {
      state.visitor = action.payload;
    },
    setSessionData: (state, action: PayloadAction<SessionState>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.studentId = action.payload.studentId;
      state.visitor = action.payload.visitor;
    },
  },
});

export const { setVisitor, setSessionData } = sessionSlice.actions;

export default sessionSlice.reducer;
