import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Badge, NavDropdown } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

const Navbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const { items } = useAppSelector((state) => state.cart);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <BootstrapNavbar bg="white" expand="lg" className="shadow-sm" sticky="top">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold text-primary-custom">
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
            Ramniya Creations
          </span>
                </BootstrapNavbar.Brand>

                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-lg-center">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/products">Products</Nav.Link>

                        {isAuthenticated ? (
                            <>
                                <Nav.Link as={Link} to="/orders">Orders</Nav.Link>
                                <Nav.Link as={Link} to="/cart" className="position-relative">
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute top-0 start-100 translate-middle"
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>

                                <NavDropdown
                                    title={user?.name || 'Account'}
                                    id="user-dropdown"
                                    className="ms-lg-2"
                                >
                                    <NavDropdown.Item as={Link} to="/profile">
                                        Profile
                                    </NavDropdown.Item>
                                    {user?.role === 'admin' && (
                                        <>
                                            <NavDropdown.Divider />
                                            <NavDropdown.Item as={Link} to="/admin/dashboard">
                                                Admin Dashboard
                                            </NavDropdown.Item>
                                        </>
                                    )}
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout}>
                                        Logout
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/cart" className="position-relative">
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute top-0 start-100 translate-middle"
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Link to="/register">
                                    <button className="btn btn-primary ms-lg-2">
                                        Register
                                    </button>
                                </Link>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};

export default Navbar;
