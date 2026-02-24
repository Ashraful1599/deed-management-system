import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/lib/auth';

interface UserState {
  currentUser: User | null;
  loading: boolean;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
