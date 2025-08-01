import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";


const ProtectedRoute= ()=>{
    const {isAuthenticated}= useSelector((state)=>state.adminAuth)

    return isAuthenticated?<Outlet/>: <Navigate to='/adm/login' replace />
}

export default ProtectedRoute