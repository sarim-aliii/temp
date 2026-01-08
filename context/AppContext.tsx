import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    LoginCredentials,
    SignupCredentials,
    User,
    NotificationType
} from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { authApi, userApi } from '../services/api';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AppContextType {
    // Auth
    isAuthenticated: boolean;
    currentUser: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
    

    verifyEmail: (data: { email: string; token: string }) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (data: { email: string; otp: string; password: string }) => Promise<void>;
    updateUserName: (name: string) => Promise<void>;
    updateUserAvatar: (avatar: string) => Promise<void>;

    // UI State
    theme: 'dark' | 'light';
    toggleTheme: () => void;

    notifications: Notification[];
    addNotification: (message: string, type?: NotificationType) => void;
    removeNotification: (id: number) => void;
}

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');

    const isAuthenticated = !!token && !!currentUser;

    const handleSetToken = (newToken: string | null) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
    };

    // Theme effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Notifications
    const addNotification = useCallback((message: string, type: NotificationType = 'error') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // --- USER PROFILE UPDATES ---
    const updateUserName = async (name: string) => {
        if (!currentUser) return;
        try {
            const updatedUser = await userApi.updateProfile({ name });
            setCurrentUser(updatedUser.data || updatedUser);
            addNotification("Username updated!", "success");
        } catch (error: any) {
            addNotification(error.message || "Failed to update username");
        }
    };

    const updateUserAvatar = async (avatar: string) => {
        if (!currentUser) return;
        const previousUser = { ...currentUser };
        setCurrentUser({ ...currentUser, avatar });
        
        try {
            await userApi.updateProfile({ avatar });
            addNotification("Avatar updated!", "success");
        } catch (e: any) {
            setCurrentUser(previousUser);
            addNotification("Failed to save avatar", "error");
        }
    };

    // --- LOGOUT ---
    const logout = useCallback(() => {
        handleSetToken(null);
        setCurrentUser(null);
        window.location.href = '/#/login'; 
    }, []);

    // --- INIT AUTH ---
    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            
            if (storedToken) {
                if (token !== storedToken) setToken(storedToken);

                try {
                    const response = await authApi.getMe();
                    const userData = response.data || response;
                    setCurrentUser(userData);
                } 
                catch (error) {
                    console.error("Session restore failed", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); 

    // --- AUTH ACTIONS ---
    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authApi.login(credentials);
            const data = response.data || response;
            
            handleSetToken(data.token);
            
            setCurrentUser({
                _id: data._id || data.id, 
                name: data.name,
                email: data.email,
                avatar: data.avatar,
                isVerified: data.isVerified,
            });
        } catch (error: any) {
            addNotification(error.message || 'Login failed.');
            throw error;
        }
    };

    const signup = async (credentials: SignupCredentials) => {
        try {
            await authApi.signup(credentials);
            addNotification('Sign up successful! Please check your email.', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Sign up failed.');
            throw error;
        }
    };

    const handleSocialLoginSuccess = async (response: any, providerName: string) => {
        const data = response.data || response;
        handleSetToken(data.token);

        setCurrentUser({
            _id: data._id || data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            isVerified: data.isVerified,
        });
        addNotification(`Logged in with ${providerName}!`, 'success');
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            
            const data = await authApi.googleLogin(idToken);
            await handleSocialLoginSuccess(data, 'Google');
        }
        catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') return;
            addNotification(error.message || 'Google login failed.');
            throw error;
        }
    };

    const verifyEmail = async (data: { email: string; token: string }) => {
        try {
            const response = await authApi.verifyEmail(data);
            const responseData = response.data || response;

            if (responseData.token) {
                handleSetToken(responseData.token);
            }

            setCurrentUser({
                _id: responseData._id || responseData.id,
                name: responseData.name,
                email: responseData.email,
                avatar: responseData.avatar,
                isVerified: true,
            });
            addNotification('Email verified successfully! Logging you in...', 'success');
        } 
        catch (error: any) {
            addNotification(error.message || 'Email verification failed.');
            throw error;
        }
    };

    const requestPasswordReset = async (email: string) => {
        try {
            await authApi.forgotPassword({ email });
            addNotification('If an account exists, a reset email has been sent.', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Failed to request password reset.');
            throw error;
        }
    };

    const resetPassword = async (data: { email: string; otp: string; password: string }) => {
        try {
            await authApi.resetPassword(data);
            addNotification('Password reset successfully! Please log in.', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Password reset failed.');
            throw error;
        }
    };

    const value = {
        isAuthenticated,
        currentUser,
        loading,
        login,
        loginWithGoogle,
        signup,
        logout,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
        updateUserAvatar,
        updateUserName,
        notifications,
        addNotification,
        removeNotification,
        theme,
        toggleTheme,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};