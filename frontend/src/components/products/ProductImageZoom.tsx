import React, { useState, useRef } from 'react';
import { ProductImage } from '../../types';

interface ProductImageZoomProps {
    images: ProductImage[];
    title: string;
}

const ProductImageZoom: React.FC<ProductImageZoomProps> = ({ images, title }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [zoom, setZoom] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);

    const sortedImages = images.length > 0
        ? [...images].sort((a, b) => a.display_order - b.display_order)
        : [];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setMousePosition({ x, y });
    };

    if (sortedImages.length === 0) {
        return (
            <div className="product-image-placeholder">
                <img
                    src="/placeholder.jpg"
                    alt={title}
                    className="w-100 rounded"
                    style={{ height: '500px', objectFit: 'cover' }}
                />
            </div>
        );
    }

    return (
        <div className="product-image-zoom">
            {/* Main Image with Zoom */}
            <div
                ref={imageRef}
                className="main-image-container position-relative"
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
                onMouseMove={handleMouseMove}
                style={{
                    overflow: 'hidden',
                    cursor: zoom ? 'zoom-in' : 'default',
                    height: '500px',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--surface)',
                }}
            >
                <img
                    src={sortedImages[activeIndex]?.url || '/placeholder.jpg'}
                    alt={title}
                    className="w-100 h-100"
                    style={{
                        objectFit: 'contain',
                        transform: zoom ? 'scale(2)' : 'scale(1)',
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        transition: zoom ? 'none' : 'transform 0.3s ease',
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                />

                {zoom && (
                    <div
                        className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded"
                        style={{
                            fontSize: '0.875rem',
                            opacity: 0.9,
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        Move mouse to zoom
                    </div>
                )}
            </div>

            {/* Thumbnail Navigation */}
            {sortedImages.length > 1 && (
                <div className="thumbnail-container d-flex gap-2 mt-3 overflow-auto pb-2">
                    {sortedImages.map((image, index) => (
                        <div
                            key={image.id}
                            className={`thumbnail ${index === activeIndex ? 'active' : ''}`}
                            onClick={() => setActiveIndex(index)}
                            style={{
                                width: '80px',
                                height: '80px',
                                flexShrink: 0,
                                cursor: 'pointer',
                                border: index === activeIndex ? '3px solid var(--primary)' : '1px solid var(--border)',
                                borderRadius: '0.375rem',
                                overflow: 'hidden',
                                transition: 'all 0.2s ease',
                                opacity: index === activeIndex ? 1 : 0.6,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                if (index !== activeIndex) {
                                    e.currentTarget.style.opacity = '0.6';
                                }
                            }}
                        >
                            <img
                                src={image.url}
                                alt={`${title} - ${index + 1}`}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductImageZoom;
