import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        {
            path: '/admin/dashboard',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            label: 'Dashboard',
        },
        {
            path: '/admin/orders',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
            ),
            label: 'Orders',
        },
        {
            path: '/admin/products',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
            ),
            label: 'Products',
        },
        {
            path: '/',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
            label: 'Back to Store',
        },
    ];

    return (
        <div
            className="admin-sidebar"
            style={{
                width: '250px',
                height: '100vh',
                position: 'fixed',
                top: '70px',
                left: 0,
                backgroundColor: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                padding: '1rem 0',
                overflowY: 'auto',
            }}
        >
            <Nav className="flex-column">
                {menuItems.map((item) => (
                    <Nav.Link
                        key={item.path}
                        as={Link}
                        to={item.path}
                        className={`d-flex align-items-center gap-3 px-4 py-3 ${
                            isActive(item.path) ? 'bg-primary-custom text-dark' : 'text-muted'
                        }`}
                        style={{
                            borderLeft: isActive(item.path) ? '4px solid var(--primary)' : '4px solid transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {item.icon}
                        <span className="fw-medium">{item.label}</span>
                    </Nav.Link>
                ))}
            </Nav>
        </div>
    );
};

export default AdminSidebar;
