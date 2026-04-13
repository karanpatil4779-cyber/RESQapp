import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppStateContext';
import { ShieldCheck, MapPin, ArrowRight, Loader2, Phone, KeyRound } from 'lucide-react';

const LoginCivilian = () => {
    const navigate = useNavigate();
    const { login } = useAppState();
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [serverUrl, setServerUrl] = useState('http://localhost:3001');

    const formatPhone = (input) => {
        const digits = input.replace(/\D/g, '');
        if (digits.length <= 5) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
        
        try {
            const res = await fetch(`${serverUrl}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setOtpSent(true);
                if (data.otp) {
                    setOtp(data.otp);
                    setError('OTP shown below (check server console if empty)');
                }
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Server not reachable. Try running locally or check server URL.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
        
        try {
            const res = await fetch(`${serverUrl}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone, otp })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                login('CIVILIAN', { 
                    name: data.user.name, 
                    id: `CIV-${data.user.id}`, 
                    role: 'CIVILIAN',
                    phone: formattedPhone
                });
                navigate('/report');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Server not reachable. Try running locally or check server URL.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-4">
            
            <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">ResQLink Public Access</h1>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">We are here to help. Sign in to report incidents or track status.</p>
            </div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input 
                                    type="tel"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all font-mono text-lg"
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 ml-1">We will send a one-time verification code.</p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all flex items-center justify-center shadow-lg shadow-amber-200 disabled:opacity-70 text-lg"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Enter OTP</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all font-mono text-lg text-center tracking-widest"
                                    placeholder="------"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 ml-1">Enter the 6-digit code sent to {phone}</p>
                            <button 
                                type="button" 
                                onClick={() => { setOtpSent(false); setOtp(''); }}
                                className="text-xs text-amber-600 mt-2 hover:underline"
                            >
                                Change number
                            </button>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading || otp.length !== 6}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all flex items-center justify-center shadow-lg shadow-amber-200 disabled:opacity-70 text-lg"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                        </button>
                    </form>
                )}

                {error && otpSent === false && (
                    <p className="text-red-500 text-sm text-center mt-4">{error}</p>
                )}

                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Server URL (for development)</label>
                    <input 
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        placeholder="http://localhost:3001"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                    />
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button onClick={() => navigate('/report')} className="w-full py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-colors flex items-center justify-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Report Without Signing In
                    </button>
                </div>
            </div>
            
            <p className="mt-8 text-center text-xs text-slate-400 max-w-sm">
                In a life-threatening emergency, always call <strong>112</strong> or your local emergency number first.
            </p>
        </div>
    );
};

export default LoginCivilian;
