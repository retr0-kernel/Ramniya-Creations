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
                                        const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
                                        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

                                        return (
                                            <tr key={product.id}>
                                                <td>
                                                    <img
                                                        src={primaryImage?.url || '/placeholder.jpg'}
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
                                                    <Badge bg="info">{product.variants.length} variants</Badge>
                                                    <div>
                                                        <small className="text-muted">Stock: {totalStock}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="secondary">{product.images.length} images</Badge>
                                                </td>
                                                <td>
                                                    <small className="text-muted">{formatDateTime(product.created_at)}</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Link to={`/products/${product.id}`}>
                                                            <Button variant="outline-primary" size="sm">
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
                                                            onClick={() => alert('Edit functionality coming soon!')}
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                title: formData.title,
                description: formData.description,
                price: parseInt(formData.price) * 100, // Convert to paise
                metadata: {
                    category: formData.category,
                    material: formData.material,
                    weight: formData.weight,
                },
            };

            await axios.post(API_ENDPOINTS.ADMIN_PRODUCTS, productData);
            alert('Product created successfully!');
            onSuccess();
            setFormData({
                title: '',
                description: '',
                price: '',
                category: '',
                material: '',
                weight: '',
            });
        } catch (error: any) {
            console.error('Failed to create product:', error);
            alert(error.response?.data?.error || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Create New Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
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
                                <Form.Text className="text-muted">Enter price in rupees</Form.Text>
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

                    <div className="alert alert-info">
                        <small>
                            <strong>Note:</strong> After creating the product, you can add variants and images by
                            editing the product or using the API directly.
                        </small>
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                        <Button variant="secondary" onClick={onHide}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Product'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AdminProducts;
