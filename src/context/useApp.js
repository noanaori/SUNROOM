import { useContext } from 'react';
import { AppContext } from './AppContext';

/* Custom hook biar komponen lain gampang narik data dan state global */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
