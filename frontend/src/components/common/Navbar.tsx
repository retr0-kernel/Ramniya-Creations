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
        <BootstrapNavbar
            expand="lg"
            className="shadow-sm sticky-top"
            style={{
                backgroundColor: 'var(--navbar-bg)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
            }}
        >
            <Container>
                <BootstrapNavbar.Brand
                    as={Link}
                    to="/"
                    className="fw-bold d-flex align-items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    <span
                        className="brand-icon"
                        style={{
                            fontSize: '1.8rem',
                            filter: 'drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3))'
                        }}
                    >
                        ✨
                    </span>
                    <span style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.5rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Ramniya Creations
                    </span>
                </BootstrapNavbar.Brand>

                <BootstrapNavbar.Toggle
                    aria-controls="basic-navbar-nav"
                    style={{ borderColor: 'var(--border)' }}
                />

                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-lg-center gap-lg-1">
                        <Nav.Link
                            as={Link}
                            to="/"
                            className="px-3 py-2 rounded"
                            style={{
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="me-1"
                                style={{ verticalAlign: 'middle' }}
                            >
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Home
                        </Nav.Link>

                        <Nav.Link
                            as={Link}
                            to="/products"
                            className="px-3 py-2 rounded"
                            style={{
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="me-1"
                                style={{ verticalAlign: 'middle' }}
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            Products
                        </Nav.Link>

                        {isAuthenticated ? (
                            <>
                                <Nav.Link
                                    as={Link}
                                    to="/orders"
                                    className="px-3 py-2 rounded"
                                    style={{
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                        style={{ verticalAlign: 'middle' }}
                                    >
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                    </svg>
                                    Orders
                                </Nav.Link>

                                <Nav.Link
                                    as={Link}
                                    to="/cart"
                                    className="position-relative px-3 py-2 rounded"
                                    style={{
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                        style={{ verticalAlign: 'middle' }}
                                    >
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{
                                                top: '0px',
                                                right: '-5px',
                                                fontSize: '0.7rem',
                                                minWidth: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>

                                <div className="mx-2">
                                    <ThemeToggle />
                                </div>

                                <NavDropdown
                                    title={
                                        <div className="d-inline-flex align-items-center gap-2">
                                            <div
                                                className="avatar"
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#000',
                                                    fontWeight: '600',
                                                    fontSize: '0.95rem',
                                                    border: '2px solid var(--border)',
                                                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span
                                                className="d-none d-lg-inline"
                                                style={{
                                                    color: 'var(--text-primary)',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {user?.name || 'Account'}
                                            </span>
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="var(--text-secondary)"
                                                strokeWidth="2"
                                                className="d-none d-lg-inline"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    }
                                    id="user-dropdown"
                                    className="ms-lg-1"
                                    align="end"
                                >
                                    <div className="px-3 py-2 border-bottom" style={{ borderColor: 'var(--border) !important' }}>
                                        <div className="small text-muted">Signed in as</div>
                                        <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {user?.email}
                                        </div>
                                    </div>

                                    <NavDropdown.Item
                                        as={Link}
                                        to="/profile"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                            style={{ verticalAlign: 'middle' }}
                                        >
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        My Profile
                                    </NavDropdown.Item>

                                    {user?.role === 'admin' && (
                                        <>
                                            <NavDropdown.Divider />
                                            <div className="px-3 py-1">
                                                <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                    Admin
                                                </small>
                                            </div>
                                            <NavDropdown.Item
                                                as={Link}
                                                to="/admin/dashboard"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="me-2"
                                                    style={{ verticalAlign: 'middle' }}
                                                >
                                                    <rect x="3" y="3" width="7" height="7" />
                                                    <rect x="14" y="3" width="7" height="7" />
                                                    <rect x="14" y="14" width="7" height="7" />
                                                    <rect x="3" y="14" width="7" height="7" />
                                                </svg>
                                                Dashboard
                                            </NavDropdown.Item>
                                            <NavDropdown.Item
                                                as={Link}
                                                to="/admin/products"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="me-2"
                                                    style={{ verticalAlign: 'middle' }}
                                                >
                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                                </svg>
                                                Manage Products
                                            </NavDropdown.Item>
                                            <NavDropdown.Item
                                                as={Link}
                                                to="/admin/orders"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="me-2"
                                                    style={{ verticalAlign: 'middle' }}
                                                >
                                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                                </svg>
                                                Manage Orders
                                            </NavDropdown.Item>
                                        </>
                                    )}

                                    <NavDropdown.Divider />
                                    <NavDropdown.Item
                                        onClick={handleLogout}
                                        style={{ color: '#e74c3c' }}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                            style={{ verticalAlign: 'middle' }}
                                        >
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign Out
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link
                                    as={Link}
                                    to="/cart"
                                    className="position-relative px-3 py-2 rounded"
                                    style={{
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                        style={{ verticalAlign: 'middle' }}
                                    >
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Cart
                                    {cartItemsCount > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{
                                                top: '0px',
                                                right: '-5px',
                                                fontSize: '0.7rem',
                                                minWidth: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {cartItemsCount}
                                        </Badge>
                                    )}
                                </Nav.Link>

                                <div className="mx-2">
                                    <ThemeToggle />
                                </div>

                                <Nav.Link
                                    as={Link}
                                    to="/login"
                                    className="px-3 py-2 rounded"
                                    style={{
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-1"
                                        style={{ verticalAlign: 'middle' }}
                                    >
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Login
                                </Nav.Link>

                                <Link to="/register" className="ms-2">
                                    <button
                                        className="btn btn-primary btn-sm px-3"
                                        style={{
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                                            border: 'none'
                                        }}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-1"
                                            style={{ verticalAlign: 'middle' }}
                                        >
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="8.5" cy="7" r="4" />
                                            <line x1="20" y1="8" x2="20" y2="14" />
                                            <line x1="23" y1="11" x2="17" y2="11" />
                                        </svg>
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
