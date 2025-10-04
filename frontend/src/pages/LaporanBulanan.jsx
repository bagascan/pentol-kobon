import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useOutlet } from '../context/OutletContext';

const reportService = {
  getMonthly: (params) => api.get('/summary-reports/monthly', { params }),
  getYearly: (params) => api.get('/summary-reports/yearly', { params }),
};

const LaporanBulanan = () => {
  const { activeOutlet } = useOutlet();
  const [reportType, setReportType] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1); // Dari Januari
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1); // Sampai bulan ini
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
  }));

  useEffect(() => {
    fetchReport();
  }, [reportType, year, startMonth, endMonth, activeOutlet]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      let response;
      const params = { year, outletId: activeOutlet?._id };

      if (reportType === 'monthly') {
        params.startMonth = startMonth;
        params.endMonth = endMonth;
        response = await reportService.getMonthly(params);
      } else {
        response = await reportService.getYearly(params);
      }
      setData(response.data);
    } catch (err) {
      setError('Gagal memuat laporan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  };

  const renderMonthlyReport = (reportData) => {
    if (!reportData) return null; // PERBAIKAN: Jangan render jika data tidak ada

    const { summary, assetReport } = reportData;
    return (
      <div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Laporan Rentang {months.find(m => m.value === startMonth)?.name} - {months.find(m => m.value === endMonth)?.name} {year}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <InfoBox title="Total Pendapatan" value={summary.totalRevenue} isCurrency />
            <InfoBox title="Laba Bersih" value={summary.netProfit} isCurrency isProfit />
            <InfoBox title="Total HPP" value={summary.totalCOGS} isCurrency />
            <InfoBox title="Total Biaya Operasional" value={summary.totalExpense} isCurrency />
            <InfoBox title="Total Transaksi" value={summary.totalTransactions} />
          </div>
        </div>

        {assetReport && assetReport.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Rekapitulasi Peralatan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assetReport.map(item => {
                const discrepancy = item.totalBrought - item.totalReturned;
                return (
                  <div key={item._id} style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', gap: '1rem', fontSize: '0.9em' }}>
                    <strong style={{fontSize: '1em'}}>{item._id}</strong>
                    <span style={{textAlign: 'center'}}>Bawa: {item.totalBrought}</span>
                    <span style={{textAlign: 'center'}}>Kembali: {item.totalReturned}</span>
                    <span style={{textAlign: 'right', fontWeight: 'bold', color: discrepancy > 0 ? '#d9534f' : (discrepancy < 0 ? '#5cb85c' : 'inherit')}}>
                      Selisih: {discrepancy > 0 ? `-${discrepancy}` : (discrepancy < 0 ? `+${Math.abs(discrepancy)}` : 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderYearlyReport = (reportData) => {
    if (!reportData) return null; // PERBAIKAN: Jangan render jika data tidak ada

    const { summary, assetReport } = reportData;

    return (
      <div>
        <h3 style={{ marginTop: 0 }}>Laporan Tahun {year}</h3>
        {summary && summary.length > 0 ? summary.map(item => (
          <div key={item._id.month} style={{...cardStyle, marginBottom: '1rem'}}>
            <h4 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '0.5rem'}}>{months.find(m => m.value === item._id.month)?.name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '0.9em' }}>
              <span>Pendapatan:</span><span style={{ textAlign: 'right', fontWeight: 500 }}>Rp{item.totalRevenue.toLocaleString('id-ID')}</span>
              <span>Pengeluaran:</span><span style={{ textAlign: 'right', fontWeight: 500, color: '#d9534f' }}>- Rp{item.totalExpense.toLocaleString('id-ID')}</span>
              <span style={{color: '#1565c0'}}>Laba Bersih:</span><span style={{ textAlign: 'right', fontWeight: 500, color: '#1565c0' }}>Rp{item.netProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )) : <p>Tidak ada data untuk tahun ini.</p>}

        {assetReport && assetReport.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Rekapitulasi Peralatan Tahunan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assetReport.map(item => {
                const discrepancy = item.totalBrought - item.totalReturned;
                return (
                  <div key={item._id} style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', gap: '1rem', fontSize: '0.9em' }}>
                    <strong style={{fontSize: '1em'}}>{item._id}</strong>
                    <span style={{textAlign: 'center'}}>Bawa: {item.totalBrought}</span>
                    <span style={{textAlign: 'center'}}>Kembali: {item.totalReturned}</span>
                    <span style={{textAlign: 'right', fontWeight: 'bold', color: discrepancy > 0 ? '#d9534f' : (discrepancy < 0 ? '#5cb85c' : 'inherit')}}>
                      Selisih: {discrepancy > 0 ? `-${discrepancy}` : (discrepancy < 0 ? `+${Math.abs(discrepancy)}` : 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <h2>Laporan Bulanan & Tahunan</h2>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '0.5rem' }}>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: '0.5rem' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {reportType === 'monthly' && (
            <>
              <select value={startMonth} onChange={e => setStartMonth(parseInt(e.target.value))} style={{ padding: '0.5rem' }}>
                <option value="" disabled>Dari Bulan</option>
                {months.map(m => <option key={`start-${m.value}`} value={m.value}>{m.name}</option>)}
              </select>
              <select value={endMonth} onChange={e => setEndMonth(parseInt(e.target.value))} style={{ padding: '0.5rem' }}>
                <option value="" disabled>Sampai Bulan</option>
                {months.map(m => <option key={`end-${m.value}`} value={m.value}>{m.name}</option>)}
              </select>
            </>
          )}
        </div>
        <p style={{fontSize: '0.9em', color: '#666', margin: '1rem 0 0 0'}}>
          Menampilkan laporan untuk outlet: <strong>{activeOutlet?.name || 'Semua Outlet'}</strong>
        </p>
      </div>

      {loading && <p>Memuat laporan...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {data && (
        reportType === 'monthly' ? renderMonthlyReport(data) : renderYearlyReport(data)
      )}
    </div>
  );
};

const InfoBox = ({ title, value = 0, isCurrency, isProfit }) => { // PERBAIKAN: Tambahkan nilai default untuk 'value'
  const boxStyle = {
    background: '#f9f9f9',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
  };

  const valueStyle = {
    fontSize: '1.5em',
    fontWeight: 'bold',
    margin: '0.25rem 0 0 0',
    color: isProfit ? (value >= 0 ? '#1565c0' : '#d32f2f') : '#333',
  };

  const formattedValue = isCurrency ? `Rp${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID');

  return (
    <div style={boxStyle}>
      <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>{title}</p>
      <h4 style={valueStyle}>{formattedValue}</h4>
    </div>
  );
};

export default LaporanBulanan;