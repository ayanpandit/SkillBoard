import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        onClick={() => hideToast(toast.id)}
                        className={`
                            px-4 py-2 rounded-lg shadow-lg text-white 
                            cursor-pointer
                            transition-all duration-300 
                            animate-slide-in-right
                            ${toast.type === 'info' ? 'bg-blue-500' : ''}
                            ${toast.type === 'success' ? 'bg-green-500' : ''}
                            ${toast.type === 'error' ? 'bg-red-500' : ''}
                            ${toast.type === 'warning' ? 'bg-yellow-500' : ''}
                        `}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
