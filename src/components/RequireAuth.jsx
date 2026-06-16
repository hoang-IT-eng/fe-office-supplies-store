import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
export default function RequireAuth() {
    const { user } = useAuthStore();
    const loc = useLocation();
    if (!user)
        return <Navigate to={`/login?next=${loc.pathname}`} replace/>;
    return <Outlet />;
}
