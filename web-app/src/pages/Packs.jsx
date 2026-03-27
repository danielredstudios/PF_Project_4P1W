import { useState, useEffect } from 'react';
import { resourceApi } from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Packs() {
    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPacks();
    }, []);

    const loadPacks = async () => {
        try {
            // ?random=true as requested
            const res = await resourceApi.get('/api/packs?random=true');
            setPacks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container">Loading packs...</div>;

    return (
        <div className="container">
            <h1 style={{ marginBottom: '30px' }}>Choose a Pack</h1>

            {packs.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <p>No packs available right now. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {packs.map(pack => (
                        <div key={pack.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h3>{pack.name}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>{pack.description}</p>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                    {pack.puzzleCount} Puzzles
                                </span>
                                <button
                                    className="primary"
                                    onClick={() => navigate(`/play/${pack.id}`)}
                                    disabled={pack.puzzleCount === 0}
                                >
                                    Play
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
