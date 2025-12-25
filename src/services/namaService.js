import { supabase } from '../supabaseClient';

// ============================================
// Nama Accounts Service
// ============================================

export const getActiveNamaAccounts = async () => {
    const { data, error } = await supabase
        .from('nama_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
};

export const getAllNamaAccounts = async () => {
    const { data, error } = await supabase
        .from('nama_accounts')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
};

export const createNamaAccount = async (name, start_date = null, end_date = null, target_goal = null) => {
    // Build insert object - only include date/target fields if the columns exist in DB
    const insertData = {
        name,
        is_active: true
    };

    // Only add new fields if they have values (allows working before migration is run)
    if (start_date) insertData.start_date = start_date;
    if (end_date) insertData.end_date = end_date;
    if (target_goal) insertData.target_goal = parseInt(target_goal) || null;

    const { data, error } = await supabase
        .from('nama_accounts')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateNamaAccount = async (id, updates) => {
    const { data, error } = await supabase
        .from('nama_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteNamaAccount = async (id) => {
    const { error } = await supabase
        .from('nama_accounts')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// Nama Entries Service
// ============================================

export const submitNamaEntry = async (userId, accountId, count, sourceType = 'manual') => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('nama_entries')
        .insert({
            user_id: userId,
            account_id: accountId,
            count,
            source_type: sourceType,
            entry_date: today
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const submitMultipleNamaEntries = async (userId, entries, sourceType = 'manual') => {
    const today = new Date().toISOString().split('T')[0];

    const insertData = entries.map(entry => ({
        user_id: userId,
        account_id: entry.accountId,
        count: entry.count,
        source_type: sourceType,
        entry_date: today
    }));

    const { data, error } = await supabase
        .from('nama_entries')
        .insert(insertData)
        .select();

    if (error) throw error;
    return data;
};

export const getUserRecentEntries = async (userId, limit = 10) => {
    const { data, error } = await supabase
        .from('nama_entries')
        .select(`
      *,
      nama_accounts (
        name
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};

export const getUserStats = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    // Get all entries for the user
    const { data, error } = await supabase
        .from('nama_entries')
        .select('count, entry_date')
        .eq('user_id', userId);

    if (error) throw error;

    const entries = data || [];

    const stats = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        overall: 0
    };

    entries.forEach(entry => {
        const count = entry.count || 0;
        stats.overall += count;

        if (entry.entry_date === today) {
            stats.today += count;
        }
        if (entry.entry_date >= weekAgo) {
            stats.thisWeek += count;
        }
        if (entry.entry_date >= monthStart) {
            stats.thisMonth += count;
        }
        if (entry.entry_date >= yearStart) {
            stats.thisYear += count;
        }
    });

    return stats;
};

// ============================================
// Admin Services
// ============================================

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const updateUser = async (id, updates) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getAllNamaEntries = async () => {
    const { data, error } = await supabase
        .from('nama_entries')
        .select(`
      *,
      users (
        name,
        whatsapp
      ),
      nama_accounts (
        name
      )
    `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw error;
    return data || [];
};

export const updateNamaEntry = async (id, updates) => {
    const { data, error } = await supabase
        .from('nama_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteNamaEntry = async (id) => {
    const { error } = await supabase
        .from('nama_entries')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const getAccountStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
        .from('nama_accounts')
        .select('id, name')
        .eq('is_active', true);

    if (accountsError) throw accountsError;

    // Get all entries
    const { data: entries, error: entriesError } = await supabase
        .from('nama_entries')
        .select('account_id, count, entry_date');

    if (entriesError) throw entriesError;

    const accountStats = accounts.map(account => {
        const accountEntries = entries.filter(e => e.account_id === account.id);

        const stats = {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            thisYear: 0,
            overall: 0
        };

        accountEntries.forEach(entry => {
            const count = entry.count || 0;
            stats.overall += count;

            if (entry.entry_date === today) stats.today += count;
            if (entry.entry_date >= weekAgo) stats.thisWeek += count;
            if (entry.entry_date >= monthStart) stats.thisMonth += count;
            if (entry.entry_date >= yearStart) stats.thisYear += count;
        });

        return {
            id: account.id,
            name: account.name,
            ...stats
        };
    });

    return accountStats;
};

// ============================================
// User Account Links Service
// ============================================

export const getUserAccountLinks = async (userId) => {
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
    return data || [];
};

export const linkUserToAccount = async (userId, accountId) => {
    const { data, error } = await supabase
        .from('user_account_links')
        .insert({ user_id: userId, account_id: accountId })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const linkUserToAccounts = async (userId, accountIds) => {
    const insertData = accountIds.map(accountId => ({
        user_id: userId,
        account_id: accountId
    }));

    const { data, error } = await supabase
        .from('user_account_links')
        .insert(insertData)
        .select();

    if (error) throw error;
    return data;
};

export const unlinkUserFromAccount = async (userId, accountId) => {
    const { error } = await supabase
        .from('user_account_links')
        .delete()
        .eq('user_id', userId)
        .eq('account_id', accountId);

    if (error) throw error;
};

// ============================================
// Bulk User Creation Service
// ============================================

export const bulkCreateUsers = async (users, defaultAccountIds = []) => {
    const results = [];
    const errors = [];

    for (const userData of users) {
        try {
            // Create user
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    name: userData.name,
                    whatsapp: userData.whatsapp,
                    password_hash: userData.password, // Note: should be hashed
                    city: userData.city || null,
                    state: userData.state || null,
                    country: userData.country || null,
                    is_active: true
                })
                .select()
                .single();

            if (userError) {
                errors.push({ user: userData, error: userError.message });
                continue;
            }

            // Link to accounts if specified
            const accountsToLink = userData.accountIds || defaultAccountIds;
            if (accountsToLink.length > 0) {
                await linkUserToAccounts(newUser.id, accountsToLink);
            }

            results.push(newUser);
        } catch (err) {
            errors.push({ user: userData, error: err.message });
        }
    }

    return { results, errors };
};

// ============================================
// Prayer Service
// ============================================

export const submitPrayer = async (prayerData) => {
    const { data, error } = await supabase
        .from('prayers')
        .insert({
            name: prayerData.name,
            email: prayerData.email,
            phone: prayerData.phone || null,
            privacy: prayerData.privacy || 'public',
            prayer_text: prayerData.prayer_text,
            email_notifications: prayerData.email_notifications || false,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getApprovedPrayers = async () => {
    const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getPendingPrayers = async () => {
    const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const getAllPrayers = async () => {
    const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const approvePrayer = async (id, moderatorId = null) => {
    const { data, error } = await supabase
        .from('prayers')
        .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: moderatorId
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const rejectPrayer = async (id) => {
    const { data, error } = await supabase
        .from('prayers')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const incrementPrayerCount = async (id) => {
    // Use RPC for atomic increment, or fetch-update pattern
    const { data: prayer, error: fetchError } = await supabase
        .from('prayers')
        .select('prayer_count')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
        .from('prayers')
        .update({ prayer_count: (prayer.prayer_count || 0) + 1 })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ============================================
// Book Shelf Service
// ============================================

export const uploadBook = async (file, metadata) => {
    // 1. Upload file to 'books' bucket
    // Sanitize filename: replace spaces with underscores, keep alphanumeric + common chars
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}`;
    const filePath = `${fileName}`; // Uploading to root of books bucket

    const { error: uploadError } = await supabase.storage
        .from('library')
        .upload(filePath, file, {
            upsert: true
        });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('library')
        .getPublicUrl(filePath);

    // 3. Insert into books table - exclude isAutomatic as it's not a database column
    const { isAutomatic, ...bookData } = metadata;

    const { data, error } = await supabase
        .from('books')
        .insert({
            ...bookData,
            file_url: publicUrl
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getBooks = async (filters = {}) => {
    let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

    // Apply filters if they exist
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.country) query = query.eq('country', filters.country);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.language) query = query.eq('language', filters.language);
    if (filters.edition_type) query = query.eq('edition_type', filters.edition_type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getMostViewedBooks = async (limit = 5) => {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
};

export const incrementBookView = async (bookId) => {
    const { data, error } = await supabase.rpc('increment_book_view', { book_id: bookId });
    if (error) {
        console.error('Error incrementing view:', error);
        // Fallback or ignore
    }
    return data;
};

export const deleteBook = async (bookId, fileUrl) => {
    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

    if (dbError) throw dbError;

    // 2. Delete from Storage (Optional but recommended)
    if (fileUrl) {
        try {
            // Extract path from URL. URL: .../storage/v1/object/public/library/filename.pdf
            const path = fileUrl.split('library/').pop();
            if (path) {
                await supabase.storage.from('library').remove([path]);
            }
        } catch (err) {
            console.error('Error deleting file from storage:', err);
        }
    }
};
