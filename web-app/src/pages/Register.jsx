import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(email, password);
            navigate('/packs');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
            <div className="glass-card">
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Create Account</h2>
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
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button type="submit" className="primary">Register</button>
                </form>
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}
