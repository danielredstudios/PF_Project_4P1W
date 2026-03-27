import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing token on mount
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const email = localStorage.getItem('email');

        if (token && role && email) {
            setUser({ token, role, email });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await authApi.post('/auth/login', { email, password });
        const { token, role, email: userEmail } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', userEmail);

        setUser({ token, role, email: userEmail });
    };

    const register = async (email, password) => {
        const res = await authApi.post('/auth/register', { email, password });
        const { token, role, email: userEmail } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', userEmail);

        setUser({ token, role, email: userEmail });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
