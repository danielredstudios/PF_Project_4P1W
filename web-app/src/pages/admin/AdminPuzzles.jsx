import { useState, useEffect } from 'react';
import { resourceApi } from '../../api/axios';

export default function AdminPuzzles() {
    const [puzzles, setPuzzles] = useState([]);
    const [images, setImages] = useState([]);

    // Form State
    const [answerWord, setAnswerWord] = useState('');
    const [hint, setHint] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [selectedImageIds, setSelectedImageIds] = useState([]); // Up to 4

    useEffect(() => {
        loadPuzzles();
        loadImages();
    }, []);

    const loadPuzzles = async () => {
        const res = await resourceApi.get('/cms/puzzles');
        setPuzzles(res.data);
    };

    const loadImages = async () => {
        const res = await resourceApi.get('/cms/images');
        setImages(res.data);
    };

    const toggleImage = (id) => {
        if (selectedImageIds.includes(id)) {
            setSelectedImageIds(selectedImageIds.filter(x => x !== id));
        } else {
            if (selectedImageIds.length < 4) {
                setSelectedImageIds([...selectedImageIds, id]);
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (selectedImageIds.length !== 4) {
            alert("Please select exactly 4 images.");
            return;
        }

        // Map to API DTO: [ {imageId, position} ]
        const payloadImages = selectedImageIds.map((id, index) => ({
            imageId: id,
            position: index + 1
        }));

        try {
            await resourceApi.post('/cms/puzzles', {
                answerWord,
                hint,
                difficulty,
                images: payloadImages
            });

            setAnswerWord('');
            setHint('');
            setDifficulty('medium');
            setSelectedImageIds([]);
            loadPuzzles();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create puzzle");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete puzzle?")) return;
        await resourceApi.delete(`/cms/puzzles/${id}`);
        loadPuzzles();
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '20px' }}>Manage Puzzles</h1>

            <div className="glass-card" style={{ marginBottom: '30px' }}>
                <h3>Create New Puzzle</h3>
                <form onSubmit={handleCreate} className="grid" style={{ marginTop: '15px' }}>
                    <div className="grid grid-2">
                        <input
                            type="text"
                            placeholder="Answer Word"
                            value={answerWord}
                            onChange={e => setAnswerWord(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Hint (optional)"
                            value={hint}
                            onChange={e => setHint(e.target.value)}
                        />
                    </div>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>

                    <div style={{ marginTop: '10px' }}>
                        <h4>Select 4 Images ({selectedImageIds.length}/4)</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '10px 0' }}>
                            {images.map(img => (
                                <div
                                    key={img.id}
                                    onClick={() => toggleImage(img.id)}
                                    style={{
                                        minWidth: '100px',
                                        height: '100px',
                                        backgroundImage: `url(${img.url})`,
                                        backgroundSize: 'cover',
                                        borderRadius: '8px',
                                        border: selectedImageIds.includes(img.id) ? '3px solid var(--secondary)' : '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        opacity: (!selectedImageIds.includes(img.id) && selectedImageIds.length === 4) ? 0.4 : 1
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="primary" disabled={selectedImageIds.length !== 4}>
                        Create Puzzle
                    </button>
                </form>
            </div>

            <div className="grid grid-2">
                {puzzles.map(p => (
                    <div key={p.id} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>{p.answerWord}</h3>
                            <button className="danger" onClick={() => handleDelete(p.id)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Delete</button>
                        </div>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.9rem' }}>
                            Hint: {p.hint || 'None'} | Difficulty: {p.difficulty}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                            {p.images.map(img => (
                                <div
                                    key={img.imageId}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundImage: `url(${img.url})`,
                                        backgroundSize: 'cover',
                                        borderRadius: '4px'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
