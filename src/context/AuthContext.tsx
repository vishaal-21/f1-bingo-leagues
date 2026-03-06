import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ensure profile exists for authenticated user (non-blocking)
    const ensureProfile = async (authUser: User) => {
        try {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', authUser.id)
                .single();

            if (!existingProfile) {
                // Profile doesn't exist, create it
                const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user';
                await supabase
                    .from('profiles')
                    .insert({
                        id: authUser.id,
                        username: username,
                        display_name: username,
                    });
                console.log('Profile created for user:', authUser.id);
            }
        } catch (error) {
            console.error('Error ensuring profile:', error);
        }
    };

    useEffect(() => {
        console.log('[AuthContext] Initializing auth check...');
        
        // Safety timeout - if loading takes more than 5 seconds, stop loading
        const timeout = setTimeout(() => {
            console.warn('[AuthContext] Loading timeout after 5 seconds - stopping loading state');
            setIsLoading(false);
        }, 5000);

        // Get initial session - don't wait for profile creation
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            console.log('[AuthContext] Session retrieved:', session ? 'User logged in' : 'No session');
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            
            // Ensure profile exists in background
            if (session?.user) {
                console.log('[AuthContext] Checking/creating profile for user:', session.user.id);
                ensureProfile(session.user);
            }
        }).catch((error) => {
            clearTimeout(timeout);
            console.error('[AuthContext] Error getting session:', error);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[AuthContext] Auth state changed:', _event, session ? 'User logged in' : 'No session');
            setSession(session);
            setUser(session?.user ?? null);
            
            // Ensure profile exists in background
            if (session?.user) {
                ensureProfile(session.user);
            }
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
