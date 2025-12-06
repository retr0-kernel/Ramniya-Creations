import React from 'react';
import { Spinner as BootstrapSpinner } from 'react-bootstrap';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'light';
    fullScreen?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
                                             size = 'md',
                                             variant = 'primary',
                                             fullScreen = false
                                         }) => {
    const sizeClass = size === 'sm' ? 'spinner-border-sm' : size === 'lg' ? 'spinner-border-lg' : '';

    const spinner = (
        <BootstrapSpinner
            animation="border"
            variant={variant}
            className={sizeClass}
            role="status"
        >
            <span className="visually-hidden">Loading...</span>
        </BootstrapSpinner>
    );

    if (fullScreen) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default Spinner;
