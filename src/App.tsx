import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

// Placeholders for other pages to avoid build errors
import { Search } from './pages/Search';
import { MyList } from './pages/MyList';
import { Details } from './pages/Details';

import { SharedList } from './pages/SharedList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="my-list" element={<MyList />} />
          <Route path="shared" element={<SharedList />} />
          <Route path="details/:type/:id" element={<Details />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
