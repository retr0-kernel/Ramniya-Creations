import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

interface AdminRouteProps {
    children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }

    // Check if user has admin role
    if (user?.role !== 'admin') {
        return (
            <div className="container py-5">
                <div className="alert alert-danger text-center">
                    <h3>Access Denied</h3>
                    <p>You do not have permission to access this page.</p>
                    <p className="mb-0">
                        <strong>Your role:</strong> {user?.role || 'unknown'}
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default AdminRoute;
