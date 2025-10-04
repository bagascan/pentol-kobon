import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const VAPID_PUBLIC_KEY = "BMRIhY-Fza2P496L_Y-w7XWJTzbgjB4pqwm41j_IUMnQO48qWGypy_VT9gZczNjLf9EgpbCD87iAP8pofmBOVoU";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushSubscriber = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const [isChecking, setIsChecking] = useState(true);
  const [buttonText, setButtonText] = useState('Aktifkan Notifikasi');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setButtonText('Notifikasi Sudah Aktif');
          } else {
            setIsSubscribed(false);
            setButtonText('Aktifkan Notifikasi');
          }
          setIsChecking(false);
        });
      });
    }
  }, []);

  const subscribeUser = async () => {
    setButtonText('Memproses...');

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const swRegistration = await navigator.serviceWorker.ready; // Tunggu SW siap
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        // Kirim subscription ke backend
        await api.post('/users/subscribe-push', subscription);
        
        setIsSubscribed(true);
        setButtonText('Notifikasi Berhasil Diaktifkan');
      } catch (error) {
        console.error('Gagal berlangganan notifikasi:', error);
        setIsSubscribed(false); // Pastikan status kembali ke false jika gagal
        setButtonText('Gagal, Klik untuk Coba Lagi');
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button 
        onClick={subscribeUser} 
        disabled={isSubscribed || isChecking} 
        style={{ 
          padding: '0.8rem 1.2rem', marginTop: '1rem', backgroundColor: '#ff4500', color: 'white', border: 'none', borderRadius: '6px',
          cursor: (isSubscribed || isChecking) ? 'not-allowed' : 'pointer',
          opacity: (isSubscribed || isChecking) ? 0.6 : 1,
        }}>
        {isChecking ? 'Mengecek Status...' : buttonText}
      </button>
    </div>
  );
};

export default PushSubscriber;