import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Hard-coded admin credentials (5 admin accounts as per specification)
const ADMIN_CREDENTIALS = [
    { username: 'admin', password: 'namabank2024' },
    { username: 'admin1', password: 'namabank2024' },
    { username: 'admin2', password: 'namabank2024' },
    { username: 'admin3', password: 'namabank2024' },
    { username: 'admin4', password: 'namabank2024' }
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [moderator, setModerator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [linkedAccounts, setLinkedAccounts] = useState([]);

    useEffect(() => {
        // Initialize Supabase Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                // Fetch profile data without blocking the auth flow
                loadUserProfile(session.user.email);
            } else {
                setUser(null);
                setLinkedAccounts([]);
            }

            // Check for other roles
            checkOtherRoles();
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkOtherRoles = () => {
        const storedAdmin = localStorage.getItem('namabank_admin');
        const storedModerator = localStorage.getItem('namabank_moderator');

        if (storedAdmin === 'true') {
            setIsAdmin(true);
        }

        if (storedModerator) {
            try {
                setModerator(JSON.parse(storedModerator));
            } catch (e) {
                localStorage.removeItem('namabank_moderator');
            }
        }
    };

    const loadUserProfile = async (email) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (data) {
                setUser(data);
                fetchLinkedAccounts(data.id);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const fetchLinkedAccounts = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_account_links')
                .select(`
                    account_id,
                    nama_accounts (
                        id,
                        name,
                        is_active
                    )
                `)
                .eq('user_id', userId);

            if (error) throw error;

            const accounts = data
                ?.map(link => link.nama_accounts)
                .filter(acc => acc && acc.is_active) || [];

            setLinkedAccounts(accounts);
        } catch (error) {
            console.error('Error fetching linked accounts:', error);
        }
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) return { success: false, error: error.message };

            // Profile loading happens in onAuthStateChange
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred during login.' };
        }
    };

    const loginAdmin = (username, password) => {
        const isValidAdmin = ADMIN_CREDENTIALS.some(
            cred => cred.username === username && cred.password === password
        );

        if (isValidAdmin) {
            localStorage.setItem('namabank_admin', 'true');
            setIsAdmin(true);
            return { success: true };
        }
        return { success: false, error: 'Invalid admin credentials.' };
    };

    const loginModerator = async (username, password) => {
        try {
            const { data: modData, error: modError } = await supabase
                .from('moderators')
                .select('*')
                .eq('username', username)
                .single();

            if (modError || !modData) {
                return { success: false, error: 'Invalid moderator credentials.' };
            }

            if (modData.password_hash !== password) {
                return { success: false, error: 'Invalid password.' };
            }

            if (!modData.is_active) {
                return { success: false, error: 'Moderator account is disabled.' };
            }

            const modSession = {
                id: modData.id,
                name: modData.name,
                username: modData.username
            };

            localStorage.setItem('namabank_moderator', JSON.stringify(modSession));
            setModerator(modSession);

            return { success: true };
        } catch (error) {
            console.error('Moderator login error:', error);
            return { success: false, error: 'An error occurred during login.' };
        }
    };

    const register = async (userData, selectedAccountIds) => {
        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
            });

            if (authError) return { success: false, error: authError.message };

            // 2. Create profile in 'users' table
            // Note: We don't store password_hash anymore
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    created_at: new Date(),
                    name: userData.name,
                    whatsapp: userData.whatsapp,
                    email: userData.email,
                    city: userData.city || null,
                    state: userData.state || null,
                    country: userData.country || null,
                    profile_photo: userData.profile_photo || null,
                    is_active: true
                    // We can also store auth_id if we add that column later for better linking
                })
                .select()
                .single();

            if (createError) {
                // Determine if error is duplicate
                if (createError.code === '23505') { // Unique violation
                    return { success: false, error: 'User with this WhatsApp or Email already exists.' };
                }
                throw createError;
            }

            // 3. Link selected accounts
            if (selectedAccountIds.length > 0) {
                const links = selectedAccountIds.map(accountId => ({
                    user_id: newUser.id,
                    account_id: accountId
                }));

                const { error: linkError } = await supabase
                    .from('user_account_links')
                    .insert(links);

                if (linkError) throw linkError;
            }

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'An error occurred during registration.' };
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            // Use the production URL for the redirect link to ensure it always works 
            // even if requested from localhost or test environments
            const PRODUCTION_URL = 'https://nama-bank-webapp-client.vercel.app';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${PRODUCTION_URL}/reset-password`,
            });

            if (error) return { success: false, error: error.message };

            return { success: true, message: 'Password reset instructions sent to your email.' };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Failed to request password reset.' };
        }
    };

    const updatePassword = async (newPassword) => {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clear local storage for admin/moderator
        localStorage.removeItem('namabank_admin');
        localStorage.removeItem('namabank_moderator');

        setUser(null);
        setIsAdmin(false);
        setModerator(null);
        setLinkedAccounts([]);
    };

    const value = {
        user,
        isAdmin,
        moderator,
        loading,
        linkedAccounts,
        login,
        loginAdmin,
        loginModerator,
        register,
        logout,
        fetchLinkedAccounts,
        requestPasswordReset,
        updatePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
