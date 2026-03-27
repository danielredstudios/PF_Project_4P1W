import { useState, useEffect } from 'react';
import { resourceApi } from '../../api/axios';

export default function AdminTags() {
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const res = await resourceApi.get('/cms/tags');
            setTags(res.data);
        } catch (err) {
            console.error("Failed to load tags", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            await resourceApi.post('/cms/tags', { name: newTag });
            setNewTag('');
            loadTags();
        } catch (err) {
            console.error("Failed to create tag", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete tag?")) return;
        try {
            await resourceApi.delete(`/cms/tags/${id}`);
            loadTags();
        } catch (err) {
            console.error("Failed to delete tag", err);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '20px' }}>Manage Tags</h1>

            <div className="glass-card" style={{ marginBottom: '30px' }}>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="New Tag Name"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                    />
                    <button type="submit" className="primary">Add Tag</button>
                </form>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '5px 12px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                            <span>{tag.name}</span>
                            <button
                                onClick={() => handleDelete(tag.id)}
                                style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, fontSize: '1.2rem', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    {tags.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No tags found.</p>}
                </div>
            </div>
        </div>
    );
}
