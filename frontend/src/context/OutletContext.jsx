import { createContext, useState, useEffect, useContext } from 'react';
import outletService from '../features/outlets/outletService';

const OutletContext = createContext();

export const useOutlet = () => {
  return useContext(OutletContext);
};

export const OutletProvider = ({ children }) => {
  const [outlets, setOutlets] = useState([]);
  // --- PERBAIKAN: Ambil state awal dari localStorage ---
  const [activeOutlet, setActiveOutlet] = useState(() => {
    const savedOutlet = localStorage.getItem('activeOutlet');
    return savedOutlet ? JSON.parse(savedOutlet) : null;
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  // Efek untuk mendengarkan perubahan pada localStorage (misalnya saat login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    // Juga dipanggil saat login/logout manual di tab yang sama
    window.addEventListener('authChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

    useEffect(() => {
      const fetchOutlets = async () => {
        // PERBAIKAN: Jalankan untuk semua user yang sudah login
        if (user) {
          try {
            const data = await outletService.getOutlets();
            setOutlets(data);
            // Set outlet default untuk owner jika belum ada yang aktif
            const currentActive = JSON.parse(localStorage.getItem('activeOutlet'));
            if (user.role === 'owner' && !currentActive) {
              setActiveOutlet({ _id: 'all', name: 'Semua Outlet' });
            }
          } catch (error) {
            console.error("Gagal memuat outlet di context:", error);
          }
        }
        setLoading(false);
      };
      fetchOutlets();
    }, [user]); // Jalankan efek ini setiap kali user berubah

  // --- PERBAIKAN: Simpan perubahan activeOutlet ke localStorage ---
  useEffect(() => {
    if (activeOutlet) {
      localStorage.setItem('activeOutlet', JSON.stringify(activeOutlet));
    }
  }, [activeOutlet]);

  const value = { outlets, activeOutlet, setActiveOutlet, loading }; // Pastikan setActiveOutlet diekspor

  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
};
