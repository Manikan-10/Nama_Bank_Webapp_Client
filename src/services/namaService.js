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

export const createNamaAccount = async (name) => {
    const { data, error } = await supabase
        .from('nama_accounts')
        .insert({ name, is_active: true })
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
