import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Rivalry, User } from '@/types';
import { toast } from 'sonner';

interface RivalryContextType {
  rivalries: Rivalry[];
  pendingInvites: Rivalry[];
  activeRivals: Rivalry[];
  loading: boolean;
  sendRivalInvite: (username: string) => Promise<void>;
  acceptRivalInvite: (rivalryId: string) => Promise<void>;
  declineRivalInvite: (rivalryId: string) => Promise<void>;
  endRivalry: (rivalryId: string) => Promise<void>;
  refreshRivalries: () => Promise<void>;
}

const RivalryContext = createContext<RivalryContextType | undefined>(undefined);

export const RivalryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRivalries = async () => {
    if (!user) {
      setRivalries([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[RivalryContext] Fetching rivalries for user:', user.id);

      const { data, error } = await supabase
        .from('rivalries')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[RivalryContext] Raw rivalries:', data);

      // Fetch rival user details for each rivalry
      const rivalriesWithUsers = await Promise.all(
        (data || []).map(async (rivalry) => {
          const rivalUserId = rivalry.user1_id === user.id ? rivalry.user2_id : rivalry.user1_id;

          // Fetch rival's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', rivalUserId)
            .single();

          const rivalUser: User = {
            id: rivalUserId,
            email: '',
            displayName: profileData?.display_name || profileData?.username || 'Unknown User',
          };

          return {
            id: rivalry.id,
            user1Id: rivalry.user1_id,
            user2Id: rivalry.user2_id,
            status: rivalry.status,
            invitedBy: rivalry.invited_by,
            invitedAt: rivalry.invited_at,
            acceptedAt: rivalry.accepted_at,
            createdAt: rivalry.created_at,
            rivalUser,
          } as Rivalry;
        })
      );

      console.log('[RivalryContext] Rivalries with users:', rivalriesWithUsers);
      setRivalries(rivalriesWithUsers);
    } catch (error) {
      console.error('[RivalryContext] Error fetching rivalries:', error);
      toast.error('Failed to load rivalries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRivalries();

    // Subscribe to rivalry changes
    const subscription = supabase
      .channel('rivalries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rivalries',
          filter: `user1_id=eq.${user?.id}`,
        },
        () => {
          console.log('[RivalryContext] Rivalry change detected (user1)');
          fetchRivalries();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rivalries',
          filter: `user2_id=eq.${user?.id}`,
        },
        () => {
          console.log('[RivalryContext] Rivalry change detected (user2)');
          fetchRivalries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const sendRivalInvite = async (username: string) => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      console.log('[RivalryContext] Sending rival invite to:', username);

      // Find user by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        toast.error('User not found');
        return;
      }

      const targetUserId = profileData.id;

      if (targetUserId === user.id) {
        toast.error("You can't challenge yourself!");
        return;
      }

      // Check if rivalry already exists
      const { data: existingRivalry } = await supabase
        .from('rivalries')
        .select('*')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`
        )
        .single();

      if (existingRivalry) {
        if (existingRivalry.status === 'active') {
          toast.error('You are already rivals with this user');
        } else if (existingRivalry.status === 'pending') {
          toast.error('Invite already sent');
        } else {
          toast.error('A rivalry already exists with this user');
        }
        return;
      }

      // Create rivalry with user IDs in sorted order (user1_id < user2_id)
      const [user1Id, user2Id] = [user.id, targetUserId].sort();

      const { error: insertError } = await supabase.from('rivalries').insert({
        user1_id: user1Id,
        user2_id: user2Id,
        invited_by: user.id,
        status: 'pending',
      });

      if (insertError) throw insertError;

      toast.success('Rival invite sent!');
      await fetchRivalries();
    } catch (error: any) {
      console.error('[RivalryContext] Error sending invite:', error);
      toast.error(error.message || 'Failed to send invite');
    }
  };

  const acceptRivalInvite = async (rivalryId: string) => {
    try {
      console.log('[RivalryContext] Accepting rivalry:', rivalryId);

      const { error } = await supabase
        .from('rivalries')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', rivalryId);

      if (error) throw error;

      toast.success('Rivalry accepted! Let the competition begin! 🏁');
      await fetchRivalries();
    } catch (error: any) {
      console.error('[RivalryContext] Error accepting rivalry:', error);
      toast.error(error.message || 'Failed to accept rivalry');
    }
  };

  const declineRivalInvite = async (rivalryId: string) => {
    try {
      console.log('[RivalryContext] Declining rivalry:', rivalryId);

      const { error } = await supabase
        .from('rivalries')
        .update({ status: 'declined' })
        .eq('id', rivalryId);

      if (error) throw error;

      toast.success('Rivalry declined');
      await fetchRivalries();
    } catch (error: any) {
      console.error('[RivalryContext] Error declining rivalry:', error);
      toast.error(error.message || 'Failed to decline rivalry');
    }
  };

  const endRivalry = async (rivalryId: string) => {
    try {
      console.log('[RivalryContext] Ending rivalry:', rivalryId);

      const { error } = await supabase
        .from('rivalries')
        .update({ status: 'ended' })
        .eq('id', rivalryId);

      if (error) throw error;

      toast.success('Rivalry ended');
      await fetchRivalries();
    } catch (error: any) {
      console.error('[RivalryContext] Error ending rivalry:', error);
      toast.error(error.message || 'Failed to end rivalry');
    }
  };

  const refreshRivalries = async () => {
    await fetchRivalries();
  };

  // Derived state
  const pendingInvites = rivalries.filter(
    (r) => r.status === 'pending' && r.invitedBy !== user?.id
  );
  const activeRivals = rivalries.filter((r) => r.status === 'active');

  return (
    <RivalryContext.Provider
      value={{
        rivalries,
        pendingInvites,
        activeRivals,
        loading,
        sendRivalInvite,
        acceptRivalInvite,
        declineRivalInvite,
        endRivalry,
        refreshRivalries,
      }}
    >
      {children}
    </RivalryContext.Provider>
  );
};

export const useRivalry = () => {
  const context = useContext(RivalryContext);
  if (!context) {
    throw new Error('useRivalry must be used within RivalryProvider');
  }
  return context;
};
