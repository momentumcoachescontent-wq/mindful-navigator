import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export interface Connection {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

/** Returns a map of userId → ConnectionStatus for all users the current user has interacted with */
export function useConnectionStatuses() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['connections-all', user?.id],
        queryFn: async (): Promise<Record<string, ConnectionStatus>> => {
            if (!user) return {};

            const { data, error } = await supabase
                .from('user_connections')
                .select('*')
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .neq('status', 'rejected');

            if (error) throw error;

            const map: Record<string, ConnectionStatus> = {};
            for (const row of data || []) {
                const isSender = row.user_id === user.id;
                const otherId = isSender ? row.friend_id : row.user_id;

                if (row.status === 'accepted') {
                    map[otherId] = 'accepted';
                } else if (row.status === 'pending') {
                    map[otherId] = isSender ? 'pending_sent' : 'pending_received';
                }
            }
            return map;
        },
        enabled: !!user,
    });
}

/** Returns all pending requests received by the current user */
export function usePendingRequests() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['connections-pending', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_connections')
                .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
                .eq('friend_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

/** Returns count of pending requests (for badge) */
export function usePendingRequestsCount() {
    const { data } = usePendingRequests();
    return data?.length ?? 0;
}

/** Returns accepted friends for circle filter */
export function useMyCircle() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['connections-circle', user?.id],
        queryFn: async (): Promise<string[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_connections')
                .select('user_id, friend_id')
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .eq('status', 'accepted');

            if (error) throw error;

            return (data || []).map(row =>
                row.user_id === user.id ? row.friend_id : row.user_id
            );
        },
        enabled: !!user,
    });
}

/** Send a connection request to another user */
export function useSendRequest() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (targetUserId: string) => {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('user_connections').insert({
                user_id: user.id,
                friend_id: targetUserId,
                status: 'pending',
            });

            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['connections-all'] });
        },
    });
}

/** Accept a pending connection request */
export function useAcceptRequest() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (connectionId: string) => {
            const { error } = await supabase
                .from('user_connections')
                .update({ status: 'accepted' })
                .eq('id', connectionId);

            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['connections-all'] });
            qc.invalidateQueries({ queryKey: ['connections-pending'] });
            qc.invalidateQueries({ queryKey: ['connections-circle'] });
        },
    });
}

/** Reject a pending connection request */
export function useRejectRequest() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (connectionId: string) => {
            const { error } = await supabase
                .from('user_connections')
                .update({ status: 'rejected' })
                .eq('id', connectionId);

            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['connections-all'] });
            qc.invalidateQueries({ queryKey: ['connections-pending'] });
        },
    });
}

/** Remove an accepted connection (unfriend) */
export function useRemoveConnection() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (targetUserId: string) => {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('user_connections')
                .delete()
                .or(
                    `and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`
                );

            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['connections-all'] });
            qc.invalidateQueries({ queryKey: ['connections-circle'] });
        },
    });
}
