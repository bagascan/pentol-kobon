import OwnerDashboard from '../components/OwnerDashboard';

function Dashboard() {
  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <>
      <p>Selamat datang di dasbor, {user && user.name}!</p>

      {/* Tampilkan panel owner hanya jika role adalah 'owner' */}
      {user && user.role === 'owner' && (
        <OwnerDashboard />
      )}
    </>
  );
}

export default Dashboard;
