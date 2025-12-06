// Email validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone validation (Indian format)
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// Pincode validation (Indian)
export const isValidPincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// Name validation
export const isValidName = (name: string): boolean => {
    return name.trim().length >= 2;
};

// Get password strength
export const getPasswordStrength = (
    password: string
): 'weak' | 'medium' | 'strong' => {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            password
        )
    ) {
        return 'strong';
    }
    return 'medium';
};

// Validate shipping address
export interface AddressErrors {
    name?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
}

export const validateAddress = (address: any): AddressErrors => {
    const errors: AddressErrors = {};

    if (!address.name || address.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
    }

    if (!address.phone || !isValidPhone(address.phone)) {
        errors.phone = 'Invalid phone number';
    }

    if (!address.line1 || address.line1.trim().length < 5) {
        errors.line1 = 'Address must be at least 5 characters';
    }

    if (!address.city || address.city.trim().length < 2) {
        errors.city = 'City is required';
    }

    if (!address.state || address.state.trim().length < 2) {
        errors.state = 'State is required';
    }

    if (!address.pincode || !isValidPincode(address.pincode)) {
        errors.pincode = 'Invalid pincode';
    }

    if (!address.country || address.country.trim().length < 2) {
        errors.country = 'Country is required';
    }

    return errors;
};
