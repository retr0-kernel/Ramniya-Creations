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
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Products
            </h1>

            <Row>
                <Col lg={3} className="mb-4">
                    <ProductFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </Col>

                <Col lg={9}>
                    {error && <ErrorAlert error={error} />}

                    {loading ? (
                        <Spinner fullScreen />
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <p className="text-muted mb-0">
                                    {pagination?.total || 0} product{pagination?.total !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            <ProductGrid products={products} />

                            {pagination && pagination.total_pages > 1 && (
                                <div className="d-flex justify-content-center mt-5">
                                    <Pagination>
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
