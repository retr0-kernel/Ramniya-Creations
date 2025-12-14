import { ThemeProvider } from './context/ThemeContext.tsx'
import { Provider } from "react-redux";
import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App'
import { store } from "./app/store";

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </Provider>
)
