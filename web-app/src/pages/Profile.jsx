import { useState, useEffect } from 'react';
import { resourceApi } from '../api/axios';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await resourceApi.get('/api/profile/progress');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="container">Loading profile...</div>;

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '30px' }}>Player Profile</h1>

            <div className="glass-card grid">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: 'var(--primary)' }}>{user?.email}</h2>
                    <span style={{ color: 'var(--text-muted)' }}>Role: {user?.role}</span>
                </div>

                <div className="grid grid-2" style={{ gap: '20px' }}>
                    <div style={{ padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--secondary)' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                            {stats?.totalScore || 0}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>Total Score</div>
                    </div>

                    <div style={{ padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--primary)' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {stats?.totalSolved || 0}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>Puzzles Solved</div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Attempts:</span>
                    <span style={{ fontWeight: 'bold' }}>{stats?.totalAttempts || 0}</span>
                </div>

                <div style={{ padding: '15px', background: 'var(--glass-bg)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Accuracy:</span>
                    <span style={{ fontWeight: 'bold' }}>
                        {stats?.totalAttempts > 0
                            ? Math.round((stats.totalSolved / stats.totalAttempts) * 100)
                            : 0}%
                    </span>
                </div>
            </div>
        </div>
    );
}
