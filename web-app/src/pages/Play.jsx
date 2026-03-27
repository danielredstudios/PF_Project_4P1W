import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourceApi } from '../api/axios';

export default function Play() {
    const { packId } = useParams();
    const navigate = useNavigate();

    const [puzzle, setPuzzle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guess, setGuess] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [nextAvailable, setNextAvailable] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [answerSlots, setAnswerSlots] = useState([]);
    const [poolLetters, setPoolLetters] = useState([]);
    const [hintUsed, setHintUsed] = useState(false);

    useEffect(() => {
        loadNextPuzzle();
    }, [packId]);

    useEffect(() => {
        if (answerSlots.length > 0 && answerSlots.every(s => s !== null) && !feedback) {
            handleSubmit();
        }
    }, [answerSlots, feedback]);

    const loadNextPuzzle = async () => {
        try {
            setLoading(true);
            setFeedback(null);
            setGuess('');
            setHintUsed(false);

            const res = await resourceApi.get(`/api/puzzles/next?packId=${packId}`);
            if (res.data.message === "Pack completed!") {
                setCompleted(true);
            } else {
                setPuzzle(res.data);
                if (res.data.answerLength && res.data.scrambledLetters) {
                    setAnswerSlots(Array(res.data.answerLength).fill(null));
                    setPoolLetters(res.data.scrambledLetters.split('').map((char, index) => ({ char, id: index, used: false })));
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setCompleted(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePoolLetterClick = (letterObj) => {
        if (letterObj.used || feedback?.correct) return;
        
        const firstEmptyIndex = answerSlots.findIndex(slot => slot === null);
        if (firstEmptyIndex === -1) return;
        
        const newSlots = [...answerSlots];
        newSlots[firstEmptyIndex] = letterObj;
        setAnswerSlots(newSlots);
        
        const newPool = poolLetters.map(p => p.id === letterObj.id ? { ...p, used: true } : p);
        setPoolLetters(newPool);
    };

    const handleSlotClick = (slotIndex) => {
        if (feedback?.correct) return;
        const slot = answerSlots[slotIndex];
        if (!slot) return;
        
        const newSlots = [...answerSlots];
        newSlots[slotIndex] = null;
        setAnswerSlots(newSlots);
        
        const newPool = poolLetters.map(p => p.id === slot.id ? { ...p, used: false } : p);
        setPoolLetters(newPool);
    };

    const handleHint = () => {
        if (hintUsed || feedback?.correct || !puzzle?.answerWord) return;
        
        for (let i = 0; i < puzzle.answerWord.length; i++) {
            const correctChar = puzzle.answerWord[i];
            const currentSlot = answerSlots[i];
            
            if (!currentSlot || currentSlot.char !== correctChar) {
                const newSlots = [...answerSlots];
                const newPool = [...poolLetters];
                
                if (currentSlot) {
                    const poolItem = newPool.find(p => p.id === currentSlot.id);
                    if (poolItem) poolItem.used = false;
                    newSlots[i] = null;
                }
                
                let poolIndex = newPool.findIndex(p => !p.used && p.char === correctChar);
                
                if (poolIndex === -1) {
                   const wrongSlotIndex = newSlots.findIndex((s, idx) => idx > i && s?.char === correctChar);
                   if (wrongSlotIndex !== -1) {
                       const movingLetter = newSlots[wrongSlotIndex];
                       newSlots[wrongSlotIndex] = null;
                       poolIndex = newPool.findIndex(p => p.id === movingLetter.id);
                   }
                }
                
                if (poolIndex !== -1) {
                    const letterObj = newPool[poolIndex];
                    letterObj.used = true;
                    newSlots[i] = letterObj;
                    setAnswerSlots(newSlots);
                    setPoolLetters(newPool);
                    setHintUsed(true);
                    return;
                }
            }
        }
    };

    const handleShuffle = () => {
        if (feedback?.correct || poolLetters.length === 0) return;
        const shuffled = [...poolLetters].sort(() => Math.random() - 0.5);
        setPoolLetters(shuffled);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        const currentGuess = answerSlots.map(s => s ? s.char : '').join('');
        if (!puzzle || currentGuess.length !== puzzle.answerLength) return;

        try {
            const res = await resourceApi.post('/api/game/submit', {
                puzzleId: puzzle.puzzleId,
                guess: currentGuess
            });

            setFeedback(res.data);
            setNextAvailable(res.data.nextAvailable);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container">Loading puzzle...</div>;

    if (completed) return (
        <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <div className="glass-card">
                <h1 style={{ color: 'var(--success)' }}>Pack Completed</h1>
                <p style={{ margin: '20px 0' }}>You have solved all puzzles in this pack.</p>
                <button className="primary" onClick={() => navigate('/packs')}>
                    Choose Another Pack
                </button>
            </div>
        </div>
    );

    if (!puzzle) return <div className="container">Error loading puzzle.</div>;

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Difficulty: {puzzle.difficulty}</span>
                </div>

                <div className="image-board">
                    {puzzle.images.map(img => (
                        <div
                            key={img.imageId}
                            className="image-tile"
                            style={{
                                backgroundImage: `url(${img.url})`
                            }}
                        />
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 20px' }}>
                    <button 
                        onClick={handleHint}
                        disabled={hintUsed || feedback?.correct}
                        title="Reveal Letter"
                        style={{ 
                            width: '50px', height: '50px',
                            background: 'var(--surface)', 
                            border: 'none', borderRadius: '50%',
                            fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)',
                            opacity: hintUsed ? 0.5 : 1, cursor: hintUsed ? 'not-allowed' : 'pointer',
                            transform: hintUsed ? 'translateY(2px)' : 'none'
                        }}
                    >
                        💡
                    </button>
                    
                    <button 
                        onClick={handleShuffle}
                        disabled={feedback?.correct}
                        title="Shuffle Letters"
                        style={{ 
                            width: '50px', height: '50px',
                            background: 'var(--surface)', 
                            border: 'none', borderRadius: '50%',
                            fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(15, 23, 42, 0.12)',
                            cursor: 'pointer'
                        }}
                    >
                        🔀
                    </button>
                </div>
                {puzzle.hint && (
                    <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {puzzle.hint}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {answerSlots.map((slot, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSlotClick(idx)}
                            style={{
                                width: '40px', height: '40px',
                                background: slot ? '#e8f0ff' : '#f8fbff',
                                border: '2px solid #cdd9e8',
                                borderRadius: '6px',
                                color: 'var(--secondary-hover)',
                                fontSize: '1.35rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: slot && !feedback?.correct ? 'pointer' : 'default',
                                boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.08)',
                                textTransform: 'uppercase'
                            }}
                        >
                            {slot ? slot.char : ''}
                        </div>
                    ))}
                </div>

                <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', 
                    maxWidth: '350px', margin: '0 auto', marginBottom: '20px',
                    padding: '15px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px solid var(--glass-border)'
                }}>
                    {poolLetters.map((letter) => (
                        <button
                            key={letter.id}
                            onClick={() => handlePoolLetterClick(letter)}
                            disabled={letter.used || feedback?.correct}
                            style={{
                                padding: '10px 0',
                                background: letter.used ? 'transparent' : '#ffffff',
                                border: letter.used ? 'none' : '1px solid #bfd2e8',
                                borderRadius: '6px',
                                color: letter.used ? 'transparent' : 'var(--text-color)',
                                fontSize: '1.3rem', fontWeight: '700',
                                cursor: letter.used || feedback?.correct ? 'default' : 'pointer',
                                boxShadow: letter.used ? 'none' : '0 4px 8px rgba(15, 23, 42, 0.1)',
                                textTransform: 'uppercase',
                                transform: (letter.used || feedback?.correct) ? 'translateY(2px)' : 'none',
                                transition: 'transform 0.1s'
                            }}
                        >
                            {letter.char}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        borderRadius: '8px',
                        background: feedback.correct ? 'rgba(15, 118, 110, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                        border: `1px solid ${feedback.correct ? 'var(--success)' : 'var(--error)'}`
                    }}>
                        <h3 style={{ color: feedback.correct ? 'var(--success)' : 'var(--error)' }}>
                            {feedback.correct ? 'Correct! ✅' : 'Incorrect ❌'}
                        </h3>
                        <p>{feedback.message}</p>
                        {feedback.correct && (
                            <p style={{ marginTop: '5px', color: 'var(--secondary)' }}>
                                +{feedback.scoreDelta} points!
                            </p>
                        )}

                        {feedback.correct && (
                            <div style={{ marginTop: '15px' }}>
                                {nextAvailable ? (
                                    <button className="primary" onClick={loadNextPuzzle}>
                                        Next Puzzle
                                    </button>
                                ) : (
                                    <button className="primary" onClick={() => setCompleted(true)}>
                                        Finish Pack
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
