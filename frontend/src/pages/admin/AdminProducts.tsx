import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const AdminProducts: React.FC = () => {
    return (
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Manage Products
            </h1>

            <Alert variant="info">
                <Alert.Heading>Admin Product Management</Alert.Heading>
                <p>
                    This page would contain:
                </p>
                <ul>
                    <li>List all products with edit/delete actions</li>
                    <li>Create new product form</li>
                    <li>Upload product images</li>
                    <li>Manage variants and stock</li>
                </ul>
                <p className="mb-0">
                    For now, use the API directly via Postman to manage products.
                </p>
            </Alert>
        </Container>
    );
};

export default AdminProducts;