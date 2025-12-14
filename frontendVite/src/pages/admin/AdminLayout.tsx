import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminLayout: React.FC = () => {
    return (
        <div className="d-flex">
            <AdminSidebar />
            <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: 'calc(100vh - 70px)' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;