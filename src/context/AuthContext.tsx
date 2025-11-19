import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    hasPin: boolean;
    login: (pin: string) => boolean;
    setupPin: (pin: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PIN_STORAGE_KEY = 'accounting_app_pin';
const SESSION_KEY = 'accounting_app_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasPin, setHasPin] = useState(false);

    useEffect(() => {
        const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
        if (storedPin) {
            setHasPin(true);
            const session = sessionStorage.getItem(SESSION_KEY);
            if (session === 'true') {
                setIsAuthenticated(true);
            }
        }
    }, []);

    const login = (pin: string) => {
        const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
        const inputHash = btoa(pin);

        if (inputHash === storedPin) {
            setIsAuthenticated(true);
            sessionStorage.setItem(SESSION_KEY, 'true');
            return true;
        }
        return false;
    };

    const setupPin = (pin: string) => {
        const hash = btoa(pin);
        localStorage.setItem(PIN_STORAGE_KEY, hash);
        setHasPin(true);
        setIsAuthenticated(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(SESSION_KEY);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, hasPin, login, setupPin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
