import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, status = 'info', hideDefaultButton = false }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1300,
    animation: 'fadeIn 0.3s ease-out',
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '400px',
    animation: 'slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const statusColors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3',
  };

  const titleStyle = {
    color: statusColors[status] || statusColors.info,
    marginTop: 0,
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#ff4500',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '2rem',
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>{title}</h2>
        <div style={{ color: '#666' }}>{children}</div>
        {!hideDefaultButton && (
          <button onClick={onClose} style={buttonStyle}>Mengerti</button>
        )}
      </div>
    </div>
  );
};

export default Modal;