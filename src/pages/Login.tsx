import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, isLoading } = useAuth();

    if (!isLoading && user) {
        return <Navigate to="/home" />;
    }

    const handleAction = async (isSignUp: boolean, e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                // Validate username
                if (!username || username.trim().length < 3) {
                    toast.error('Username must be at least 3 characters');
                    setLoading(false);
                    return;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                    toast.error('Username can only contain letters, numbers, underscores, and hyphens');
                    setLoading(false);
                    return;
                }

                // Sign up the user
                const { data, error: signUpError } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        data: {
                            username: username.trim()
                        },
                        emailRedirectTo: window.location.origin
                    }
                });

                if (signUpError) {
                    toast.error(signUpError.message);
                    console.error('Signup error:', signUpError);
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    // Create profile manually
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: data.user.id,
                            username: username.trim(),
                            display_name: username.trim(),
                        });

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        toast.error('Account created but profile setup failed. Please contact support.');
                    } else {
                        toast.success('Successfully signed up!');
                    }
                }
            } else {
                // Login
                const { error: loginError } = await supabase.auth.signInWithPassword({ 
                    email, 
                    password 
                });

                if (loginError) {
                    toast.error(loginError.message);
                    console.error('Login error:', loginError);
                } else {
                    toast.success('Logged in successfully!');
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">F1 CHAOS</h1>
                    <p className="text-sm text-muted-foreground">Sign in to play and sync leagues</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={(e) => handleAction(false, e)} className="space-y-4">
                            <div className="space-y-2">
                                <Input type="email" placeholder="Email Address" value={email} required onChange={(e) => setEmail(e.target.value)} />
                                <Input type="password" placeholder="Password" value={password} required onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Processing...' : 'Login'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form onSubmit={(e) => handleAction(true, e)} className="space-y-4">
                            <div className="space-y-2">
                                <Input 
                                    type="text" 
                                    placeholder="Username (letters, numbers, _, -)" 
                                    value={username} 
                                    required 
                                    minLength={3}
                                    maxLength={30}
                                    pattern="[a-zA-Z0-9_-]+"
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                                <Input type="email" placeholder="Email Address" value={email} required onChange={(e) => setEmail(e.target.value)} />
                                <Input type="password" placeholder="Password (min 6 chars)" value={password} required minLength={6} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Processing...' : 'Create Account'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
