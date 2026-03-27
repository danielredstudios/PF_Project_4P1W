import { useState, useEffect } from 'react';
import { resourceApi } from '../../api/axios';

export default function AdminPacks() {
    const [packs, setPacks] = useState([]);
    const [puzzles, setPuzzles] = useState([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // For managing pack puzzles
    const [activePackId, setActivePackId] = useState(null);
    const [puzzleToAdd, setPuzzleToAdd] = useState('');

    useEffect(() => {
        loadPacks();
        loadPuzzles();
    }, []);

    const loadPacks = async () => {
        const res = await resourceApi.get('/cms/packs');
        setPacks(res.data);
    };

    const loadPuzzles = async () => {
        const res = await resourceApi.get('/cms/puzzles');
        setPuzzles(res.data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await resourceApi.post('/cms/packs', { name, description });
            setName('');
            setDescription('');
            loadPacks();
        } catch (err) {
            alert("Failed to create pack");
        }
    };

    const togglePublish = async (id) => {
        try {
            await resourceApi.post(`/cms/packs/${id}/publish`);
            loadPacks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete pack?")) return;
        await resourceApi.delete(`/cms/packs/${id}`);
        loadPacks();
    };

    const addPuzzleToPack = async (e) => {
        e.preventDefault();
        if (!activePackId || !puzzleToAdd) return;
        try {
            await resourceApi.post(`/cms/packs/${activePackId}/puzzles/${puzzleToAdd}`);
            loadPacks();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add puzzle");
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '20px' }}>Manage Packs</h1>

            <div className="glass-card" style={{ marginBottom: '30px' }}>
                <h3>Create New Pack</h3>
                <form onSubmit={handleCreate} className="grid grid-2" style={{ marginTop: '15px' }}>
                    <input
                        type="text"
                        placeholder="Pack Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                    <button type="submit" className="primary" style={{ gridColumn: 'span 2' }}>
                        Create Pack
                    </button>
                </form>
            </div>

            <div className="grid">
                {packs.map(pack => (
                    <div key={pack.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>{pack.name}</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => togglePublish(pack.id)}
                                    style={{
                                        background: pack.isPublished ? 'rgba(15, 118, 110, 0.12)' : 'var(--surface-soft)',
                                        color: pack.isPublished ? 'var(--success)' : 'var(--text-color)',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    {pack.isPublished ? 'Published' : 'Draft'}
                                </button>
                                <button className="danger" onClick={() => handleDelete(pack.id)}>Delete</button>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)' }}>{pack.description}</p>
                        <p><strong>Puzzles in Pack: {pack.puzzleCount}</strong></p>

                        <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)' }}>
                            <h4>Add Puzzle to Pack</h4>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setActivePackId(pack.id);
                                    addPuzzleToPack(e);
                                }}
                                style={{ display: 'flex', gap: '10px', marginTop: '10px' }}
                            >
                                <select
                                    value={activePackId === pack.id ? puzzleToAdd : ''}
                                    onChange={(e) => {
                                        setActivePackId(pack.id);
                                        setPuzzleToAdd(e.target.value);
                                    }}
                                >
                                    <option value="">Select a puzzle...</option>
                                    {puzzles.map(p => (
                                        <option key={p.id} value={p.id}>{p.answerWord}</option>
                                    ))}
                                </select>
                                <button type="submit" className="primary" disabled={!puzzleToAdd || activePackId !== pack.id}>Add</button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
