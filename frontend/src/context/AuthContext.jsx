import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const AuthProvider = ({ children }) => {

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [company, setCompany] = useState(null);
    const [email, setEmail] = useState(null);
    const [phone, setPhone] = useState(null);
    const [userId, setUserId] = useState(null);
    const [firstLogin, setFirstLogin] = useState(0);
    const [profileStrength, setProfileStrength] = useState(35);

    const navigate = useNavigate();


    const checkAuth = async () => {
        try {
            const response = await axios.get(
                "https://helpstir.in/csr-api/auth/verifytoken",
                { withCredentials: true }
            );
            if (response.status === 200 && response.data.token) {
                setIsAuthenticated(true);
                setUser(response.data.name);
                setCompany(response.data.company)
                setEmail(response.data.email)
                setPhone(response.data.phone)
                setUserId(response.data.user_id)
                setFirstLogin(response.data.is_first_login)
                setProfileStrength(response.data.profile_strength)
            }

            if (response.status === 401) {
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error("Authentication check failed:", err);
            localStorage.removeItem("selectedTenant");
            setIsAuthenticated(false);
        }
    };

    const login = async (phone) => {
        try {
            const response = await axios.post(
                'https://helpstir.in/csr-api/auth/login',
                { phone },
                { withCredentials: true }
            );

            return response;
        } catch (error) {
            toast.error(error.response?.data?.error || "Incorrect Phone Number");
            throw error;
        }
    };

    const loginOTPVerification = async (userId, otp) => {
      try {

        const response = await axios.post('https://helpstir.in/csr-api/auth/verify-login-otp', { user_id: userId, otp }, { withCredentials: true });
    
        const data = await response.data;

        if(data.token) {
            setIsAuthenticated(true);
            setUser(data.user.name);
            setEmail(data.user.email);
            setCompany(data.user.company_name);
            setPhone(data.user.phone);
            setUserId(data.user.user_id);
            setFirstLogin(data.is_first_login);
            setProfileStrength(data.user.profile_strength)
            checkAuth();
        }
    
        return {
          status: response.status,
          data: response.data,
        };
      } catch (error) {
        console.error("Error during OTP verification:", error);
    
        return {
          status: 500,
          success: false,
          message: "Network Error",
        };
      }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const logout = async () => {
        try {
            const response = await axios.post('https://helpstir.in/csr-api/auth/logout', {}, { withCredentials: true });
            if (response.status === 200) {
            setIsAuthenticated(false);
            setUser(null);
            setUserPermission(null)

            toast.success(response.data.message, {
                position: "top-center",
                autoClose: 3000,
                pauseOnHover: false,
            });
            navigate('/');
        }

        } catch (error) {
            console.log(error)
        }
    };

    return (
        <AuthContext.Provider value={{
            login,
            isAuthenticated,
            user,
            company,
            email,
            phone,
            userId,
            loginOTPVerification,
            firstLogin,
            logout,
            profileStrength,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};
