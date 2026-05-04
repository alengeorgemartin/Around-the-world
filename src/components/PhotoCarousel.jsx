import React, { useState, useEffect, useRef } from 'react';

/**
 * PhotoCarousel — reusable image slideshow identical to the login-page style.
 *
 * Props:
 *   photos      {string[]}  Array of image URLs. Falls back to `fallback` when empty.
 *   fallback    {string}    Fallback image URL used when photos array is empty.
 *   alt         {string}    Alt text for the images.
 *   autoPlay    {boolean}   Auto-advance interval enabled? Default true.
 *   interval    {number}    Milliseconds between auto-advances. Default 3500.
 *   height      {string}    CSS height of the carousel container. Default '220px'.
 *   borderRadius{string}    Border radius for the container. Default '0'.
 */
const PhotoCarousel = ({
    photos = [],
    fallback = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    alt = 'photo',
    autoPlay = true,
    interval = 3500,
    height = '220px',
    borderRadius = '0',
}) => {
    const BACKEND_URL = 'http://127.0.0.1:5000';

    /**
     * Resolve a stored photo path to a full URL.
     * - Already full http(s) URLs → returned as-is
     * - /uploads/ paths → prefixed with the backend origin
     * - Raw Unsplash fragment IDs → wrapped in unsplash URL
     */
    const resolveUrl = (src) => {
        if (!src) return fallback;
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        if (src.startsWith('/uploads/')) return `${BACKEND_URL}${src}`;
        // Unsplash fragment fallback
        return `https://images.unsplash.com/photo-${src}?auto=format&fit=crop&w=600&q=80`;
    };
    const images = photos && photos.length > 0 ? photos : [fallback];
    const [current, setCurrent] = useState(0);
    const timerRef = useRef(null);

    const startTimer = () => {
        if (!autoPlay || images.length < 2) return;
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % images.length);
        }, interval);
    };

    useEffect(() => {
        startTimer();
        return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.length]);

    const go = (dir, e) => {
        e.stopPropagation();
        clearInterval(timerRef.current);
        setCurrent(prev => (prev + dir + images.length) % images.length);
        startTimer();
    };

    const goTo = (idx, e) => {
        e.stopPropagation();
        clearInterval(timerRef.current);
        setCurrent(idx);
        startTimer();
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height,
                overflow: 'hidden',
                borderRadius,
                background: '#111',
            }}
        >
            {/* Slides */}
            {images.map((src, idx) => (
                <img
                    key={idx}
                    src={resolveUrl(src)}
                    alt={`${alt} ${idx + 1}`}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: idx === current ? 1 : 0,
                        transition: 'opacity 0.45s ease',
                    }}
                />
            ))}

            {/* Arrows — only when multiple photos */}
            {images.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => go(-1, e)}
                        style={{
                            position: 'absolute', top: '50%', left: 10,
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.45)', color: '#fff',
                            border: 'none', borderRadius: '50%',
                            width: 30, height: 30, cursor: 'pointer',
                            fontSize: 14, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 2,
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                    >&#10094;</button>

                    <button
                        type="button"
                        onClick={(e) => go(1, e)}
                        style={{
                            position: 'absolute', top: '50%', right: 10,
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.45)', color: '#fff',
                            border: 'none', borderRadius: '50%',
                            width: 30, height: 30, cursor: 'pointer',
                            fontSize: 14, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 2,
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                    >&#10095;</button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute', bottom: 10, left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', gap: 5, zIndex: 2,
                    }}>
                        {images.map((_, idx) => (
                            <span
                                key={idx}
                                onClick={(e) => goTo(idx, e)}
                                style={{
                                    width: 6, height: 6,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    opacity: idx === current ? 1 : 0.45,
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    transition: 'opacity 0.2s',
                                }}
                            />
                        ))}
                    </div>

                    {/* Photo count badge */}
                    <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.55)', color: '#fff',
                        fontSize: 11, padding: '2px 7px',
                        borderRadius: 12, zIndex: 2,
                    }}>
                        {current + 1}/{images.length}
                    </div>
                </>
            )}
        </div>
    );
};

export default PhotoCarousel;
