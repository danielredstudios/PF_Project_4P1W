import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/packs');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
            <div className="glass-card">
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Login</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '15px' }}>{error}</div>}
                <form onSubmit={handleSubmit} className="grid">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="primary">Login</button>
                </form>
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
