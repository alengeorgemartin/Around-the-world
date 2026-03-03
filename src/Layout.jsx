import React from 'react';
import { useLocation } from 'react-router-dom';
import TopNavigation from './components/ui/custom/TopNavigation';

// Layout wrapper component
const Layout = ({ children }) => {
    const location = useLocation();

    // Hide TopNavigation on login and register pages
    const hideNavPaths = ['/login', '/register'];
    const shouldShowNav = !hideNavPaths.includes(location.pathname);

    return (
        <>
            {shouldShowNav && <TopNavigation />}
            {children}
        </>
    );
};

export default Layout;
