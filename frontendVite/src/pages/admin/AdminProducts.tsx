import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Card, Row, Col, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/common/Spinner';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import { Product } from '../../types';

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchProducts();
    }, [page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_ENDPOINTS.PRODUCTS}?page=${page}&limit=20&sort_by=created_at&sort_order=desc`
            );
            setProducts(response.data.products || []);
            if (response.data.pagination) {
                setTotalPages(response.data.pagination.total_pages);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await axios.delete(API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id));
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product');
        }
    };

    const filteredProducts = products.filter((product) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            product.title.toLowerCase().includes(search) ||
            product.description.toLowerCase().includes(search) ||
            product.id.toLowerCase().includes(search)
        );
    });

    if (loading && products.length === 0) return <Spinner fullScreen />;

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Manage Products</h1>
                    <p className="text-muted mb-0">View and manage your product catalog</p>
                </div>
                <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="me-2"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Product
                </Button>
            </div>

            {/* Search and Stats */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <Form.Group>
                                <InputGroup size="lg">
                                    <InputGroup.Text>
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
                                        </svg>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search products by title, description, or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <div className="text-end">
                                <h3 className="mb-0">{products.length}</h3>
                                <small className="text-muted">Total Products</small>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Products Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="empty-state">
                            <svg
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="mb-3"
                                style={{ opacity: 0.3 }}
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                            </svg>
                            <h3>No Products Found</h3>
                            <p>Create your first product to get started</p>
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                Create Product
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover>
                                    <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>Image</th>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Variants</th>
                                        <th>Images</th>
                                        <th>Created</th>
                                        <th style={{ width: '200px' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.map((product) => {
                                        // Safe access to images and variants
                                        const images = product.images || [];
                                        const variants = product.variants || [];
                                        const primaryImage = images.find((img) => img.is_primary) || images[0];
                                        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

                                        return (
                                            <tr key={product.id}>
                                                <td>
                                                    {primaryImage ? (
                                                        <img
                                                            src={primaryImage.url}
                                                            alt={product.title}
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px',
                                                            }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                borderRadius: '8px',
                                                                backgroundColor: 'var(--surface-hover)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <svg
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                opacity="0.3"
                                                            >
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                                <polyline points="21 15 16 10 5 21" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-semibold">{product.title}</div>
                                                        <small className="text-muted">
                                                            {product.description.substring(0, 60)}
                                                            {product.description.length > 60 ? '...' : ''}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="price">{formatPrice(product.price)}</div>
                                                </td>
                                                <td>
                                                    {variants.length > 0 ? (
                                                        <>
                                                            <Badge bg="info">{variants.length} variants</Badge>
                                                            <div>
                                                                <small className="text-muted">Stock: {totalStock}</small>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Badge bg="secondary">No variants</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {images.length > 0 ? (
                                                        <Badge bg="secondary">{images.length} images</Badge>
                                                    ) : (
                                                        <Badge bg="warning">No images</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <small className="text-muted">{formatDateTime(product.created_at)}</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Link to={`/products/${product.id}`}>
                                                            <Button variant="outline-primary" size="sm" title="View Product">
                                                                <svg
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => alert('Edit functionality coming soon! Use the API to edit products.')}
                                                            title="Edit Product"
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            title="Delete Product"
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <nav>
                                        <ul className="pagination">
                                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(page - 1)}>
                                                    Previous
                                                </button>
                                            </li>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = Math.max(1, page - 2) + i;
                                                if (pageNum > totalPages) return null;
                                                return (
                                                    <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(pageNum)}>
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(page + 1)}>
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Create Product Modal */}
            <CreateProductModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchProducts();
                }}
            />
        </Container>
    );
};

// Create Product Modal Component
interface CreateProductModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ show, onHide, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        material: '',
        weight: '',
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [variants, setVariants] = useState<Array<{
        sku: string;
        size: string;
        color: string;
        price_modifier: string;
        stock: string;
    }>>([]);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(filesArray);

            // Create previews
            const previews = filesArray.map((file) => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(newPreviews);

        // Adjust primary index if needed
        if (primaryImageIndex >= newImages.length) {
            setPrimaryImageIndex(Math.max(0, newImages.length - 1));
        }
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                sku: '',
                size: '',
                color: '',
                price_modifier: '0',
                stock: '0',
            },
        ]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: string, value: string) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Step 1: Create product
            const productData: any = {
                title: formData.title,
                description: formData.description,
                price: parseInt(formData.price) * 100, // Convert to paise
                metadata: {
                    category: formData.category,
                    material: formData.material,
                    weight: formData.weight,
                },
            };

            // Add variants if any
            if (showAdvanced && variants.length > 0) {
                productData.variants = variants.map((v) => ({
                    sku: v.sku,
                    size: v.size || null,
                    color: v.color || null,
                    price_modifier: parseInt(v.price_modifier) * 100,
                    stock: parseInt(v.stock),
                }));
            }

            const createResponse = await axios.post(API_ENDPOINTS.ADMIN_PRODUCTS, productData);
            const productId = createResponse.data.id;

            // Step 2: Upload images if any
            if (showAdvanced && images.length > 0) {
                const formData = new FormData();
                images.forEach((image) => {
                    formData.append('images', image);
                });
                formData.append('is_primary', primaryImageIndex === 0 ? 'true' : 'false');

                await axios.post(
                    `${API_ENDPOINTS.ADMIN_PRODUCTS}/${productId}/images`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            }

            alert('Product created successfully!');
            onSuccess();

            // Reset form
            setFormData({
                title: '',
                description: '',
                price: '',
                category: '',
                material: '',
                weight: '',
            });
            setVariants([]);
            setImages([]);
            setImagePreviews([]);
            setShowAdvanced(false);
        } catch (error: any) {
            console.error('Failed to create product:', error);
            alert(error.response?.data?.error || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Create New Product</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <h5 className="mb-3">Basic Information</h5>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Product Title *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., 22K Gold Necklace Set"
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Description *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed product description..."
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Price (₹) *</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="5000"
                                    min="0"
                                    required
                                />
                                <Form.Text className="text-muted">Enter base price in rupees</Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Category</Form.Label>
                                <Form.Select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select category</option>
                                    <option value="jewelry">Jewelry</option>
                                    <option value="handicraft">Handicraft</option>
                                    <option value="accessories">Accessories</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Material</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.material}
                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    placeholder="e.g., 22K gold, Silver"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Weight</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="e.g., 50g"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <hr className="my-4" />

                    {/* Advanced Options Toggle */}
                    <Form.Check
                        type="switch"
                        id="advanced-toggle"
                        label="Add Images & Variants (Advanced)"
                        checked={showAdvanced}
                        onChange={(e) => setShowAdvanced(e.target.checked)}
                        className="mb-3"
                    />

                    {showAdvanced && (
                        <>
                            {/* Image Upload */}
                            <div className="mb-4">
                                <h5 className="mb-3">Product Images</h5>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Upload Images</Form.Label>
                                    <Form.Control
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <Form.Text className="text-muted">
                                        You can upload multiple images. Maximum 10 images.
                                    </Form.Text>
                                </Form.Group>

                                {imagePreviews.length > 0 && (
                                    <div>
                                        <p className="fw-semibold mb-2">Preview:</p>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {imagePreviews.map((preview, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        width: '120px',
                                                        height: '120px',
                                                        border: primaryImageIndex === index ? '3px solid var(--primary)' : '1px solid var(--border)',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            display: 'flex',
                                                            gap: '4px',
                                                            padding: '4px',
                                                        }}
                                                    >
                                                        {primaryImageIndex !== index && (
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => setPrimaryImageIndex(index)}
                                                                title="Set as primary"
                                                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                            >
                                                                ★
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => removeImage(index)}
                                                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                        >
                                                            ✕
                                                        </Button>
                                                    </div>
                                                    {primaryImageIndex === index && (
                                                        <Badge
                                                            bg="primary"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '4px',
                                                                left: '4px',
                                                                fontSize: '0.65rem',
                                                            }}
                                                        >
                                                            Primary
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="my-4" />

                            {/* Variants */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">Product Variants</h5>
                                    <Button variant="outline-primary" size="sm" onClick={addVariant}>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-1"
                                        >
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Add Variant
                                    </Button>
                                </div>

                                {variants.length === 0 ? (
                                    <div className="text-center py-3 text-muted">
                                        <small>No variants added. Click "Add Variant" to create one.</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {variants.map((variant, index) => (
                                            <Card key={index} className="border">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <strong>Variant #{index + 1}</strong>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeVariant(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="small">SKU *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    size="sm"
                                                                    value={variant.sku}
                                                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                                    placeholder="PROD-001"
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="small">Stock *</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    size="sm"
                                                                    value={variant.stock}
                                                                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                                                    placeholder="10"
                                                                    min="0"
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="small">Size</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    size="sm"
                                                                    value={variant.size}
                                                                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                                                    placeholder="M"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="small">Color</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    size="sm"
                                                                    value={variant.color}
                                                                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                                                    placeholder="Gold"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="small">Price Modifier (₹)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    size="sm"
                                                                    value={variant.price_modifier}
                                                                    onChange={(e) =>
                                                                        updateVariant(index, 'price_modifier', e.target.value)
                                                                    }
                                                                    placeholder="0"
                                                                />
                                                                <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                    +/- from base price
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="alert alert-info">
                        <small>
                            <strong>Tip:</strong> You can create a basic product first and add images/variants
                            later, or enable "Advanced" mode to add everything at once.
                        </small>
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Creating...
                                </>
                            ) : (
                                'Create Product'
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AdminProducts;
