import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useRedux';

interface Props {
    children: React.ReactNode;
    roles?: string[];
}

const ProtectedRoute = ({ children, roles }: Props) => {
    const { isAuthenticated, user } = useAppSelector(s => s.auth);
    const location = useLocation();

    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

    return <>{children}</>;
};

export default ProtectedRoute;
