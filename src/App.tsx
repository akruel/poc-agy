import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { authService } from './services/auth';
import { useStore } from './store/useStore';

// Placeholders for other pages to avoid build errors
import { Search } from './pages/Search';
import { MyList } from './pages/MyList';
import { Details } from './pages/Details';

import { SharedList } from './pages/SharedList';
import { JoinListPage } from './pages/JoinListPage';

function App() {
  const syncWithSupabase = useStore((state) => state.syncWithSupabase);

  useEffect(() => {
    const init = async () => {
      const userId = await authService.initializeAuth();
      if (userId) {
        await syncWithSupabase();
      }
    };
    init();
  }, [syncWithSupabase]);

  return (
    <>
      <Toaster 
        position="top-center"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'rgb(31 41 55)',
            border: '1px solid rgb(55 65 81)',
            color: 'rgb(243 244 246)',
          },
        }}
      />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="lists" element={<MyList />} />
          <Route path="shared" element={<SharedList />} />
          <Route path="details/:type/:id" element={<Details />} />
          <Route path="lists/:id" element={<MyList />} />
          <Route path="lists/:id/join" element={<JoinListPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
