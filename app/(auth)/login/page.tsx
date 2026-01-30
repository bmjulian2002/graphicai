'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, Loader2, ChevronRight, Apple } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError('Credenciales inválidas');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black transition-colors duration-500">
            <div className="w-full max-w-[400px] px-6">

                {/* Header Icon */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="w-20 h-20 bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex items-center justify-center mb-2 animate-in zoom-in-50 duration-500">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Apple className="w-7 h-7 text-white fill-current" />
                        </div>
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            GraphicAI
                        </h1>
                        <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
                            Tu espacio creativo inteligente
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-[28px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-[13px] font-medium text-center animate-in shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div className="group">
                                <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2 ml-1">
                                    Email
                                </label>
                                <div className="relative transition-transform duration-200 focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full pl-11 pr-4 py-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none rounded-2xl text-[17px] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:bg-[#E5E5EA] dark:focus:bg-[#3A3A3C] transition-all"
                                        placeholder="ejemplo@icloud.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                                <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2 ml-1">
                                    Contraseña
                                </label>
                                <div className="relative transition-transform duration-200 focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full pl-11 pr-4 py-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none rounded-2xl text-[17px] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:bg-[#E5E5EA] dark:focus:bg-[#3A3A3C] transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#007AFF] hover:bg-[#0071E3] active:scale-95 text-white font-semibold text-[17px] py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-4 animate-in fade-in duration-1000 delay-300">
                    <p className="text-[14px] text-gray-500 dark:text-gray-400">
                        ¿No tienes una cuenta?{' '}
                        <Link
                            href="/register"
                            className="text-[#007AFF] font-medium hover:text-[#0071E3] transition-colors"
                        >
                            Regístrate
                        </Link>
                    </p>
                    <div className="flex justify-center gap-6 text-[12px] text-gray-400">
                        <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacidad</Link>
                        <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Términos</Link>
                        <Link href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Ayuda</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
