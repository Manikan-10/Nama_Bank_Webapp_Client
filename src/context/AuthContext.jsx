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
        // Check for stored session on mount
        const storedUser = localStorage.getItem('namabank_user');
        const storedAdmin = localStorage.getItem('namabank_admin');
        const storedModerator = localStorage.getItem('namabank_moderator');

        if (storedAdmin === 'true') {
            setIsAdmin(true);
            setLoading(false);
        } else if (storedModerator) {
            try {
                const modData = JSON.parse(storedModerator);
                setModerator(modData);
            } catch (error) {
                console.error('Error parsing stored moderator:', error);
                localStorage.removeItem('namabank_moderator');
            }
            setLoading(false);
        } else if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                fetchLinkedAccounts(userData.id);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('namabank_user');
            }
        }
        setLoading(false);
    }, []);

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

    const login = async (whatsapp, password) => {
        try {
            // Fetch user by WhatsApp number
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('whatsapp', whatsapp)
                .single();

            if (userError || !userData) {
                return { success: false, error: 'User not found. Please register first.' };
            }

            // Verify password (simple comparison for now)
            if (userData.password_hash !== password) {
                return { success: false, error: 'Invalid password.' };
            }

            if (!userData.is_active) {
                return { success: false, error: 'Your account has been disabled. Please contact admin.' };
            }

            // Store user session
            const userSession = {
                id: userData.id,
                name: userData.name,
                whatsapp: userData.whatsapp,
                city: userData.city,
                state: userData.state,
                country: userData.country,
                profile_photo: userData.profile_photo
            };

            localStorage.setItem('namabank_user', JSON.stringify(userSession));
            setUser(userSession);
            await fetchLinkedAccounts(userData.id);

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
            // Fetch moderator by username
            const { data: modData, error: modError } = await supabase
                .from('moderators')
                .select('*')
                .eq('username', username)
                .single();

            if (modError || !modData) {
                return { success: false, error: 'Invalid moderator credentials.' };
            }

            // Verify password
            if (modData.password_hash !== password) {
                return { success: false, error: 'Invalid password.' };
            }

            if (!modData.is_active) {
                return { success: false, error: 'Moderator account is disabled.' };
            }

            // Store moderator session
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
            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('whatsapp', userData.whatsapp)
                .single();

            if (existingUser) {
                return { success: false, error: 'A user with this WhatsApp number already exists.' };
            }

            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    name: userData.name,
                    whatsapp: userData.whatsapp,
                    password_hash: userData.password,
                    city: userData.city || null,
                    state: userData.state || null,
                    country: userData.country || null,
                    profile_photo: userData.profile_photo || null,
                    is_active: true
                })
                .select()
                .single();

            if (createError) throw createError;

            // Link selected accounts
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
            return { success: false, error: 'An error occurred during registration.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('namabank_user');
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
        fetchLinkedAccounts
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
