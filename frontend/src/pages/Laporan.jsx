import { useState, useEffect, useMemo } from 'react';
import dailyLogService from '../features/dailyLogs/dailyLogService';

function LaporanPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null); // Ganti selectedLog menjadi selectedDate
  const [filter, setFilter] = useState({
    date: '',
    month: '',
    year: '',
  });

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Cukup panggil getLogs, karena semua data sudah termasuk di dalamnya
        const logData = await dailyLogService.getLogs();
        setLogs(Array.isArray(logData) ? logData : []);
      } catch (error) {
        console.error("Gagal memuat laporan (Axios Error):", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []); // Hanya jalankan sekali saat komponen dimuat

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Reset filter lain saat satu filter diubah
    setFilter({
      date: name === 'date' ? value : '',
      month: name === 'month' ? value : '',
      year: name === 'year' ? value : '',
    });
    setSelectedDate(null);
  };

  const handleSelectDate = (summary) => {
    // Jika ringkasan yang diklik sudah terpilih, tutup detailnya (set ke null)
    if (selectedDate?._id === summary._id) {
      setSelectedDate(null);
    } else {
      setSelectedDate(summary); // Jika belum, pilih ringkasan ini
    }
  };

  // Gunakan useMemo untuk memfilter data dan membuat opsi filter
  const { dailySummaries, availableYears, availableMonths } = useMemo(() => {
    const isFilterActive = filter.date || filter.month || filter.year;

    const filteredLogs = logs.filter(log => {
      if (!isFilterActive) return true;
      const logDate = new Date(log.createdAt);
      if (filter.date) {
        // PERBAIKAN: Atasi masalah timezone dengan membandingkan string tanggal
        // Ini akan membandingkan '2023-10-26' dengan '2023-10-26' tanpa terpengaruh jam atau timezone.
        const logDateString = logDate.toISOString().split('T')[0];
        // Input date dari HTML sudah dalam format YYYY-MM-DD
        const filterDateString = filter.date;
        
        return logDateString === filterDateString;
      } else if (filter.month) {
        const [year, month] = filter.month.split('-');
        return logDate.getFullYear() === parseInt(year) && logDate.getMonth() === parseInt(month) - 1;
      } else if (filter.year) {
        return logDate.getFullYear() === parseInt(filter.year);
      }
      return false;
    });

    // Generate filter options dari data log asli
    const yearSet = new Set();
    const monthSet = new Set();
    logs.forEach(log => {
      const logDate = new Date(log.createdAt);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, '0');
      monthSet.add(`${year}-${month}`);
      yearSet.add(year); // PERBAIKAN: Tambahkan tahun ke dalam set
    });

    return {
      dailySummaries: filteredLogs,
      availableYears: Array.from(yearSet).sort((a, b) => b - a),
      availableMonths: Array.from(monthSet).sort((a, b) => b.localeCompare(a))
    };
  }, [logs, filter]);

  if (loading) {
    return <p>Memuat laporan...</p>;
  }

  // --- PERUBAHAN LOGIKA ---
  // Hitung total penjualan aktual HARI INI dari semua outlet
  const todayStr = new Date().toISOString().split('T')[0]; // Dapatkan tanggal hari ini format YYYY-MM-DD
  
  const todaysLogs = logs.filter(log => 
    new Date(log.createdAt).toISOString().split('T')[0] === todayStr
  );
  const todaysTotalRevenue = todaysLogs.reduce((sum, log) => sum + (log.calculated?.totalRevenue || 0), 0);
  const todaysTotalProfit = todaysLogs.reduce((sum, log) => sum + (log.calculated?.netProfit || 0), 0);

  return (
    <div>
      <h2>Pusat Laporan</h2>

      {/* Kartu Total Keseluruhan */}
      <div style={{...cardStyle, backgroundColor: '#333', color: 'white' }}>
        <h3 style={{ marginTop: 0 }}>Ringkasan Penjualan Hari Ini</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>Pendapatan Hari Ini</p>
            <h3 style={{ margin: 0, fontSize: '1.8em' }}>Rp {todaysTotalRevenue.toLocaleString('id-ID')}</h3>
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>Laba Bersih Hari Ini</p>
            <h3 style={{ margin: 0, fontSize: '1.8em' }}>Rp {todaysTotalProfit.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Pilih Laporan Harian</h3>

        {/* --- PERBAIKAN: Bungkus filter dalam div-nya sendiri --- */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input type="date" name="date" value={filter.date} onChange={handleFilterChange} style={{ padding: '0.5rem' }} />
            <select name="month" value={filter.month} onChange={handleFilterChange} style={{ padding: '0.5rem' }}>
              <option value="">-- Pilih Bulan --</option>
              {availableMonths.map(month => <option key={month} value={month}>{new Date(month + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>)}
            </select>
            <select name="year" value={filter.year} onChange={handleFilterChange} style={{ padding: '0.5rem' }}>
              <option value="">-- Pilih Tahun --</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <button onClick={() => setFilter({ date: '', month: '', year: '' })} style={{ padding: '0.5rem',backgroundColor: '#ff4500', color: 'white', border: 'none' }}>Reset Filter</button>
          </div>
        </div>

        {/* --- PERBAIKAN: Bungkus daftar laporan dalam div-nya sendiri --- */}
        <div>
          {dailySummaries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dailySummaries.map(log => (
                <div key={log._id}>
                  {/* Header Laporan yang bisa diklik */}
                  <div
                    onClick={() => handleSelectDate(log)}
                    style={{
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: selectedDate?._id === log._id ? '8px 8px 0 0' : '8px',
                      background: selectedDate?._id === log._id ? '#fff3e0' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s, border-radius 0.1s linear',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>
                        {new Date(log.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - <span style={{ color: '#ff4500' }}>{log.outlet.name}</span>
                      </strong>
                      <div style={{ fontSize: '0.9em', color: '#555' }}>
                        <span>Pendapatan: Rp{(log.calculated?.totalRevenue || 0).toLocaleString('id-ID')}</span>
                        <span style={{ margin: '0 0.5rem' }}>|</span>
                        <span style={{ color: '#1565c0', fontWeight: '500' }}>Laba Bersih: Rp{(log.calculated?.netProfit || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <span style={{ transform: selectedDate?._id === log._id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                      ▼
                    </span>
                  </div>
                  {/* Detail Laporan (Collapse) */}
                  {selectedDate?._id === log._id && (
                    <div style={{ padding: '1rem', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#fff', boxSizing: 'border-box' }}>
                      <ReportDetail log={log} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Belum ada laporan yang tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const detailCardStyle = {
  backgroundColor: '#f9f9f9',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem',
};

// Komponen baru untuk menampilkan detail laporan
const ReportDetail = ({ log }) => {
  // PERBAIKAN: Berikan nilai default untuk 'log.calculated' untuk mencegah error jika undefined.
  const { 
    totalRevenue = 0, 
    totalCOGS = 0, 
    grossProfit = 0, 
    totalExpense = 0, 
    netProfit = 0, 
    productReport 
  } = log.calculated || {};
  const salesData = (productReport || []).sort((a, b) => b.sold - a.sold);

  // 3. Data untuk grafik
  const maxRevenue = Math.max(...salesData.map(item => item.revenue));

  return (
    <div style={{marginBottom:100}}>
      {/* Ringkasan Keuangan */}
      <div style={{ ...detailCardStyle, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>TOTAL PENDAPATAN</p>
          <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1.8em', letterSpacing: '-1px' }}>
            Rp {totalRevenue.toLocaleString('id-ID')}
          </h3>
        </div>
        <div>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>LABA BERSIH</p>
          <h3 style={{ margin: 0, color: netProfit >= 0 ? '#1565c0' : '#d32f2f', fontSize: '1.8em', letterSpacing: '-1px' }}>
            Rp {netProfit.toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      {/* Laporan Produk Terlaris */}
      <div style={detailCardStyle}>
        <h4 style={{ marginTop: 0 }}>Laporan Penjualan & Stok Produk</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {salesData.map(item => (
            <div key={item.product._id} style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #ddd', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '1.1em' }}>{item.product.name}</strong>
                <span style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#2e7d32' }}>
                  Rp{item.revenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9em' }}>
                <span>Stok Awal:</span>
                <span style={{ textAlign: 'right', fontWeight: '500' }}>{item.initial}</span>

                <span>Terjual:</span>
                <span style={{ textAlign: 'right', fontWeight: '500' }}>{item.sold}</span>

                <span style={{ color: '#0275d8' }}>Sisa Teoritis:</span>
                <span style={{ textAlign: 'right', fontWeight: '500', color: '#0275d8' }}>{item.theoreticalStock}</span>

                <span>Stok Fisik (Akhir):</span>
                <span style={{ textAlign: 'right', fontWeight: '500' }}>
                  {item.physicalStock !== undefined ? item.physicalStock : '-'}
                </span>

                <span style={{ fontWeight: 'bold' }}>Selisih:</span>
                <span style={{ textAlign: 'right', fontWeight: 'bold', color: item.discrepancy > 0 ? '#5cb85c' : (item.discrepancy < 0 ? '#d9534f' : 'inherit') }}>
                  {item.discrepancy !== null ? (item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy) : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Laporan Stok Peralatan */}
      {(log.startOfDay.assetStock.length > 0 || log.endOfDay?.remainingAssetStock?.length > 0) && (
        <div style={detailCardStyle}>
          <h4 style={{ marginTop: 0 }}>Laporan Stok Peralatan</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {log.startOfDay.assetStock.map((item, index) => {
              const remainingItem = log.endOfDay?.remainingAssetStock?.find(r => r.name === item.name) || { quantity: undefined };
              const discrepancy = remainingItem.quantity !== undefined ? item.quantity - remainingItem.quantity : null;

              return (
                <div key={`asset-${index}`} style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                  <strong style={{ fontSize: '1.1em', display: 'block', marginBottom: '0.75rem' }}>{item.name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9em' }}>
                    <span>Dibawa:</span>
                    <span style={{ textAlign: 'right', fontWeight: '500' }}>{item.quantity}</span>

                    <span>Kembali:</span>
                    <span style={{ textAlign: 'right', fontWeight: '500' }}>
                      {remainingItem.quantity !== undefined ? remainingItem.quantity : '-'}
                    </span>

                    <span style={{ fontWeight: 'bold' }}>Selisih:</span>
                    <span style={{ textAlign: 'right', fontWeight: 'bold', color: discrepancy > 0 ? '#d9534f' : (discrepancy < 0 ? '#5cb85c' : 'inherit') }}>
                      {discrepancy !== null ? (discrepancy > 0 ? `-${discrepancy}` : `+${Math.abs(discrepancy)}`) : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {!log.endOfDay && (
            <p style={{ fontSize: '0.9em', color: '#777', textAlign: 'center', marginTop: '1rem' }}>Sisa peralatan akan tampil setelah sesi ditutup.</p>
          )}
        </div>
      )}

      {/* Analisis Keuangan Lanjutan */}
      <div style={detailCardStyle}>
        <h4>Analisis Keuangan</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '0.9em' }}>
          <span>Pendapatan Kotor:</span><span style={{ textAlign: 'right' }}>Rp{totalRevenue.toLocaleString('id-ID')}</span>
          <span>(-) HPP (Modal Produk):</span><span style={{ textAlign: 'right' }}>Rp{totalCOGS.toLocaleString('id-ID')}</span>
          <span style={{ fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>Laba Kotor:</span><span style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>Rp{grossProfit.toLocaleString('id-ID')}</span>
          <span>(-) Biaya Operasional:</span><span style={{ textAlign: 'right' }}>Rp{totalExpense.toLocaleString('id-ID')}</span>
          <span style={{ fontWeight: 'bold', borderTop: '1px solid #ccc', paddingTop: '0.5rem', color: netProfit >= 0 ? '#1565c0' : '#d32f2f' }}>Laba Bersih:</span><span style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #ccc', paddingTop: '0.5rem', color: netProfit >= 0 ? '#1565c0' : '#d32f2f' }}>Rp{netProfit.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Rincian Pengeluaran */}
      {log.expenses.length > 0 && (
        <div style={detailCardStyle}>
          <h4>Rincian Pengeluaran</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9em' }}>
            {log.expenses.map(exp => (
              <li key={exp._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>{exp.description} <em style={{color: '#777'}}>({exp.category})</em></span>
                <span style={{ color: '#d9534f' }}>- Rp{Number(exp.amount).toLocaleString('id-ID')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Grafik Pendapatan */}
      <div style={detailCardStyle}>
        <h4>Grafik Pendapatan per Produk</h4>
        <div>
          {salesData.map(item => ( // Memastikan key unik menggunakan ID produk
            <div key={item.product._id} style={{ marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.9em' }}>{item.product.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flexGrow: 1, background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '20px', width: `${(item.revenue / maxRevenue) * 100}%`, background: 'linear-gradient(to right, #ff8a65, #ff4500)', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <span style={{ fontSize: '0.8em', color: '#555' }}>Rp{item.revenue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LaporanPage;
      