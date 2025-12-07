import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Badge, NavDropdown } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';

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
        <BootstrapNavbar expand="lg" className="shadow-sm sticky-top">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center gap-2">
                    <span className="brand-icon">✨</span>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
            Ramniya Creations
          </span>
                </BootstrapNavbar.Brand>

                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-lg-center gap-2">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/products">Products</Nav.Link>

                        {isAuthenticated ? (
                            <>
                                <Nav.Link as={Link} to="/orders">Orders</Nav.Link>
                                <Nav.Link as={Link} to="/cart" className="position-relative">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                    >
                                        <path d="M9 2L7 6" />
                                        <path d="M17 2L19 6" />
                                        <path d="M1 6h22v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6z" />
                                        <path d="M7 10h10" />
                                    </svg>
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{ top: '-5px', right: '-10px', fontSize: '0.7rem' }}
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>

                                <ThemeToggle />

                                <NavDropdown
                                    title={
                                        <div className="d-inline-flex align-items-center gap-2">
                                            <div
                                                className="avatar"
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#000 !important',
                                                    fontWeight: '600',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span style={{ color: 'var(--text-primary)' }}>{user?.name || 'Account'}</span>
                                        </div>
                                    }
                                    id="user-dropdown"
                                    className="ms-lg-2"
                                >
                                    <NavDropdown.Item as={Link} to="/profile">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                        >
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Profile
                                    </NavDropdown.Item>
                                    {user?.role === 'admin' && (
                                        <>
                                            <NavDropdown.Divider />
                                            <NavDropdown.Item as={Link} to="/admin/dashboard">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="me-2"
                                                >
                                                    <rect x="3" y="3" width="7" height="7" />
                                                    <rect x="14" y="3" width="7" height="7" />
                                                    <rect x="14" y="14" width="7" height="7" />
                                                    <rect x="3" y="14" width="7" height="7" />
                                                </svg>
                                                Admin Dashboard
                                            </NavDropdown.Item>
                                        </>
                                    )}
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout}>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                        >
                                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Logout
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/cart" className="position-relative">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                    >
                                        <path d="M9 2L7 6" />
                                        <path d="M17 2L19 6" />
                                        <path d="M1 6h22v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6z" />
                                        <path d="M7 10h10" />
                                    </svg>
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{ top: '-5px', right: '-10px', fontSize: '0.7rem' }}
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>
                                <ThemeToggle />
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Link to="/register">
                                    <button className="btn btn-primary btn-sm">
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
