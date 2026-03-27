import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceApi } from '../../api/axios';

export default function AdminImages() {
    const [images, setImages] = useState([]);
    const [tags, setTags] = useState([]);
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [importingTheme, setImportingTheme] = useState(false);
    const [themeMessage, setThemeMessage] = useState('');
    const [activeTagMap, setActiveTagMap] = useState({}); // imageId -> tagId to add
    const [filterTagId, setFilterTagId] = useState('');
    const [uploadTagId, setUploadTagId] = useState('');
    const [addUrlTagId, setAddUrlTagId] = useState('');

    useEffect(() => {
        loadImages();
    }, [filterTagId]);

    useEffect(() => {
        loadTags();
    }, []);

    const loadImages = async () => {
        const params = filterTagId ? { tagId: filterTagId } : {};
        const res = await resourceApi.get('/cms/images', { params });
        setImages(res.data);
    };

    const loadTags = async () => {
        const res = await resourceApi.get('/cms/tags');
        setTags(res.data);
    };

    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await resourceApi.post('/cms/images/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadTagId) {
                try { await resourceApi.post(`/cms/images/${res.data.id}/tags/${uploadTagId}`); } catch (e) { }
            }
            setFile(null);
            setUploadTagId('');
            loadImages();
        } catch (err) {
            alert(err.response?.data?.error || "Upload failed");
        }
    };

    const handleAddUrl = async (e) => {
        e.preventDefault();
        if (!url) return;
        try {
            const res = await resourceApi.post('/cms/images/url', { url, fileName: url.split('/').pop() });
            if (addUrlTagId) {
                try { await resourceApi.post(`/cms/images/${res.data.id}/tags/${addUrlTagId}`); } catch (e) { }
            }
            setUrl('');
            setAddUrlTagId('');
            loadImages();
        } catch (err) {
            alert("Add URL failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete image?")) return;
        await resourceApi.delete(`/cms/images/${id}`);
        loadImages();
    };

    const addTagToImg = async (imageId, tagId) => {
        if (!tagId) return;
        try {
            await resourceApi.post(`/cms/images/${imageId}/tags/${tagId}`);
            loadImages();
        } catch (err) {
            alert("Tag could not be added");
        }
    };

    const removeTagFromImg = async (imageId, tagId) => {
        try {
            await resourceApi.delete(`/cms/images/${imageId}/tags/${tagId}`);
            loadImages();
        } catch (err) {
            console.error(err);
        }
    };

    const ensureTag = async (name) => {
        const normalized = name.trim().toLowerCase();
        const existing = tags.find(t => t.name === normalized);
        if (existing) return existing.id;

        try {
            const created = await resourceApi.post('/cms/tags', { name: normalized });
            const newTag = created.data;
            setTags(prev => [...prev, newTag]);
            return newTag.id;
        } catch (err) {
            if (err.response?.status === 409) {
                const freshTags = await resourceApi.get('/cms/tags');
                setTags(freshTags.data);
                const found = freshTags.data.find(t => t.name === normalized);
                if (found) return found.id;
            }
            throw err;
        }
    };

    const importDanielRedTheme = async () => {
        setThemeMessage('');
        setImportingTheme(true);

        const baseUrl = 'http://localhost:5002';
        const themedImages = [
            { url: `${baseUrl}/uploads/red-cyberpunk.png`, fileName: 'red-cyberpunk.png', tags: ['danielred', 'cyberpunk'] },
            { url: `${baseUrl}/uploads/red-flower.png`, fileName: 'red-flower.png', tags: ['danielred', 'nature'] },
            { url: `${baseUrl}/uploads/red-abstract.png`, fileName: 'red-abstract.png', tags: ['danielred', 'abstract'] },
            { url: `${baseUrl}/uploads/red-car.png`, fileName: 'red-car.png', tags: ['danielred', 'cars'] }
        ];

        try {
            const uniqueTags = [...new Set(themedImages.flatMap(item => item.tags))];
            const tagIdByName = {};

            for (const tagName of uniqueTags) {
                tagIdByName[tagName] = await ensureTag(tagName);
            }

            let addedCount = 0;
            for (const image of themedImages) {
                const created = await resourceApi.post('/cms/images/url', {
                    url: image.url,
                    fileName: image.fileName
                });

                const imageId = created.data.id;
                for (const tagName of image.tags) {
                    await resourceApi.post(`/cms/images/${imageId}/tags/${tagIdByName[tagName]}`);
                }
                addedCount += 1;
            }

            await loadTags();
            await loadImages();
            setThemeMessage(`Added ${addedCount} Daniel Red themed images.`);
        } catch (err) {
            console.error(err);
            setThemeMessage('Could not import Daniel Red theme images. Please try again.');
        } finally {
            setImportingTheme(false);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1 style={{ marginBottom: 0 }}>Manage Images</h1>
                    <Link to="/admin/tags" className="primary button-style" style={{ padding: '8px 16px', textDecoration: 'none', borderRadius: '4px', display: 'inline-block' }}>
                        + Add New Category
                    </Link>
                    <button
                        className="primary"
                        onClick={importDanielRedTheme}
                        disabled={importingTheme}
                        title="Add a ready-to-use Daniel Red theme image set"
                    >
                        {importingTheme ? 'Adding Theme...' : 'Add Daniel Red Theme'}
                    </button>
                </div>
                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Tag:</label>
                    <select
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={filterTagId}
                        onChange={e => setFilterTagId(e.target.value)}
                    >
                        <option value="">All Images</option>
                        {tags.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {themeMessage && (
                <div className="status-message" style={{ marginBottom: '16px' }}>
                    {themeMessage}
                </div>
            )}

            <div className="grid grid-2" style={{ marginBottom: '30px' }}>
                <div className="glass-card">
                    <h3>Upload File</h3>
                    <form onSubmit={handleUploadFile} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                        <select value={uploadTagId} onChange={e => setUploadTagId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="">No Auto-Tag</option>
                            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <input type="file" onChange={e => setFile(e.target.files[0])} />
                        <button type="submit" className="primary">Upload</button>
                    </form>
                </div>

                <div className="glass-card">
                    <h3>Add via URL</h3>
                    <form onSubmit={handleAddUrl} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                        <select value={addUrlTagId} onChange={e => setAddUrlTagId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="">No Auto-Tag</option>
                            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <input type="url" placeholder="Image URL" value={url} onChange={e => setUrl(e.target.value)} style={{ flexGrow: 1 }} />
                        <button type="submit" className="primary">Add</button>
                    </form>
                </div>
            </div>

            {/* Group images by tag if no specific filter is selected */}
            {filterTagId ? (
                // Single grid when filtering
                <div className="grid grid-4">
                    {images.map(img => <ImageCard key={img.id} img={img} />)}
                </div>
            ) : (
                // Grouped by tag when viewing all
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {/* Untagged Images First */}
                    {images.filter(img => img.tags.length === 0).length > 0 && (
                        <div>
                            <h2 style={{ marginBottom: '15px', color: 'var(--text-muted)' }}>Untagged</h2>
                            <div className="grid grid-4">
                                {images.filter(img => img.tags.length === 0).map(img => <ImageCard key={img.id} img={img} />)}
                            </div>
                        </div>
                    )}

                    {/* Tagged Images grouped by category */}
                    {tags.map(tag => {
                        const tagImages = images.filter(img => img.tags.some(t => t.id === tag.id));
                        if (tagImages.length === 0) return null;
                        return (
                            <div key={tag.id}>
                                <h2 style={{ marginBottom: '15px', textTransform: 'capitalize' }}>{tag.name}</h2>
                                <div className="grid grid-4">
                                    {tagImages.map(img => <ImageCard key={img.id} img={img} />)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Helper component for cleanly rendering the card to avoid code duplication
    function ImageCard({ img }) {
        return (
            <div className="glass-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        width: '100%',
                        aspectRatio: '1',
                        backgroundImage: `url(${img.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        marginBottom: '15px'
                    }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px', flexGrow: 1 }}>
                    {img.tags.map(t => (
                        <span key={t.id} style={{ background: 'var(--primary)', color: 'white', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px' }}>
                            {t.name} <span style={{ cursor: 'pointer' }} onClick={() => removeTagFromImg(img.id, t.id)}>&times;</span>
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                    <select
                        style={{ padding: '4px', fontSize: '0.8rem' }}
                        value={activeTagMap[img.id] || ""}
                        onChange={e => setActiveTagMap({ ...activeTagMap, [img.id]: e.target.value })}
                    >
                        <option value="">Add Tag...</option>
                        {tags.filter(t => !img.tags.some(it => it.id === t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <button
                        className="primary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => addTagToImg(img.id, activeTagMap[img.id])}
                    >
                        +
                    </button>
                    <button className="danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDelete(img.id)}>✕</button>
                </div>
            </div>
        );
    }
}
