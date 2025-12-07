import React, { useEffect } from 'react';
import { Container, Row, Col, Pagination } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProducts, setFilters, clearFilters } from '../features/products/productsSlice';
import ProductGrid from '../components/products/ProductGrid';
import ProductFilters from '../components/products/ProductFilters';
import Spinner from '../components/common/Spinner';
import ErrorAlert from '../components/common/ErrorAlert';

const Products: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading, error, filters, pagination } = useAppSelector(
        (state) => state.products
    );

    useEffect(() => {
        dispatch(fetchProducts(filters));
    }, [dispatch, filters]);

    const handleFilterChange = (newFilters: any) => {
        dispatch(setFilters({ ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        dispatch(setFilters({ ...filters, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
    };

    return (
        <Container fluid className="py-4 px-lg-5">
            {/* Page Header */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h1 className="mb-2" style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem' }}>
                            Our Collection
                        </h1>
                        <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                            Discover exquisite handcrafted jewelry and traditional handicrafts
                        </p>
                    </div>
                    {!loading && pagination && (
                        <div className="text-end">
                            <div className="badge bg-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                {pagination.total || 0} Product{pagination.total !== 1 ? 's' : ''}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Row className="g-4">
                {/* Filters Sidebar */}
                <Col lg={3} xl={2}>
                    <div className="sticky-top" style={{ top: '90px' }}>
                        <ProductFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                        />
                    </div>
                </Col>

                {/* Products Grid */}
                <Col lg={9} xl={10}>
                    {error && <ErrorAlert error={error} />}

                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            {/* Products Grid */}
                            <ProductGrid products={products} />

                            {/* Pagination */}
                            {pagination && pagination.total_pages > 1 && (
                                <div className="d-flex justify-content-center mt-5">
                                    <Pagination size="lg">
                                        <Pagination.First
                                            onClick={() => handlePageChange(1)}
                                            disabled={!pagination.has_previous}
                                        />
                                        <Pagination.Prev
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={!pagination.has_previous}
                                        />

                                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                            const page = Math.max(
                                                1,
                                                Math.min(
                                                    pagination.page - 2 + i,
                                                    pagination.total_pages - 4
                                                )
                                            );
                                            return (
                                                <Pagination.Item
                                                    key={page}
                                                    active={page === pagination.page}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Pagination.Item>
                                            );
                                        })}

                                        <Pagination.Next
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={!pagination.has_next}
                                        />
                                        <Pagination.Last
                                            onClick={() => handlePageChange(pagination.total_pages)}
                                            disabled={!pagination.has_next}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Products;
