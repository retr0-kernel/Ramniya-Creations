export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    // Indian phone format: +91-XXXXXXXXXX or 10 digits
    const phoneRegex = /^(\+91[-\s]?)?[0]?(91)?[6789]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidPincode = (pincode: string): boolean => {
    // Indian pincode: 6 digits
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

export const isValidPassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
};

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
