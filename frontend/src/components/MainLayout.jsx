import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const MainLayout = () => {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '70px', paddingBottom: '70px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
};

export default MainLayout;