import React from 'react';
import { Alert } from 'react-bootstrap';

interface ErrorAlertProps {
    error: string | null;
    onClose?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
    if (!error) return null;

    return (
        <Alert variant="danger" dismissible={!!onClose} onClose={onClose}>
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
        </Alert>
    );
};

export default ErrorAlert;