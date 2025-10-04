import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Kasir from './pages/Kasir';
import ProductsPage from './pages/Products';
import StokAwalPage from './pages/StokAwal';
import TutupTokoPage from './pages/TutupToko';
import LaporanPage from './pages/Laporan';
import CatatPengeluaranPage from './pages/CatatPengeluaran';
import OutletManager from './pages/OutletManager';
import IngredientManager from './pages/IngredientManager';
import IngredientStockManager from './pages/IngredientStockManager';
import StockTransfer from './pages/StockTransfer';
import StockTransferHistory from './pages/StockTransferHistory';
import ProfilKaryawanPage from './pages/ProfilKaryawan';
import AssetManager from './pages/AssetManager';
import LaporanBulanan from './pages/LaporanBulanan';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Rute-rute yang menggunakan MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/stok-awal" element={<StokAwalPage />} />
            <Route path="/tutup-toko" element={<TutupTokoPage />} />
            {/* Rute ini hanya bisa diakses oleh Owner */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/catat-pengeluaran" element={<CatatPengeluaranPage />} />
            <Route path="/outlets" element={<OutletManager />} />
            <Route path="/bahan-baku" element={<IngredientManager />} />
            <Route path="/stok-bahan" element={<IngredientStockManager />} />
            <Route path="/transfer-stok" element={<StockTransfer />} />
            <Route path="/riwayat-transfer" element={<StockTransferHistory />} />
            <Route path="/profil" element={<ProfilKaryawanPage />} />
            <Route path="/peralatan" element={<AssetManager />} />
            <Route path="/laporan-bulanan" element={<LaporanBulanan />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;