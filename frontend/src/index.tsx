import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { setUser } from './features/auth/authSlice';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './styles/variables.scss';
import './styles/mixins.scss';
import './styles/global.scss';

// Load user from localStorage on app start
const userStr = localStorage.getItem('user');
const token = localStorage.getItem('access_token');

if (userStr && token) {
    try {
        const user = JSON.parse(userStr);
        store.dispatch(setUser(user));
    } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
    }
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </Provider>
    </React.StrictMode>
);
