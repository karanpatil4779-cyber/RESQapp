import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { INCIDENT_TYPES } from '../data/mockData';
import { 
    MapPin, CheckCircle, AlertOctagon, Info, ShieldCheck,
    Droplets, Flame, HeartPulse, Package, AlertTriangle, X
} from 'lucide-react';
import { cn } from '../lib/utils';

// Icon mapping to avoid 'import * as Icons'
const ICON_MAP = {
    Droplets,
    Flame,
    HeartPulse,
    Package,
    TriangleAlert: AlertTriangle // Map the data string 'TriangleAlert' to the component AlertTriangle
};

// ── Success Toast Overlay ────────────────────────────────────────────────────
const SuccessToast = ({ onClose, onNavigate }) => {
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(6);

    useEffect(() => {
        // Mount animation
        requestAnimationFrame(() => setVisible(true));

        // Countdown timer
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onNavigate();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={cn(
                "relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-500",
                visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8"
            )}>
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 6) * 100}%` }}
                    />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>

                <div className="p-8 text-center">
                    {/* Animated success icon */}
                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
                        <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-1">
                        Your emergency report has been received by
                    </p>
                    <p className="text-slate-800 font-bold text-sm mb-5">
                        Unit Alpha-1 · Sector 4 Response Team
                    </p>

                    {/* Status badges */}
                    <div className="flex gap-2 justify-center mb-6 flex-wrap">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">✓ Received</span>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">📡 Transmitted</span>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">🚑 Units Alerted</span>
                    </div>

                    {/* Next steps */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-left">
                        <h4 className="font-bold text-blue-800 text-xs mb-2 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            What to do next
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1.5 list-disc pl-4">
                            <li>Stay near your location if it is safe to do so</li>
                            <li>Keep your phone line open for verification calls</li>
                            <li>Update the report if the situation changes</li>
                        </ul>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                        >
                            Submit Another
                        </button>
                        <button 
                            onClick={onNavigate}
                            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg text-sm"
                        >
                            Dashboard ({countdown}s)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SubmitReport = () => {
    const navigate = useNavigate();
    const { addIncident, currentUser } = useAppState();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        type: '',
        severity: 'HIGH',
        description: '',
        locationConfirmed: true,
    });


    const SEVERITY_OPTIONS = [
        { id: 'LOW', label: 'Needs Attention', desc: 'Property damage, blocked roads, non-urgent.', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        { id: 'HIGH', label: 'Urgent', desc: 'Injuries, active fire, major hazard.', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        { id: 'CRITICAL', label: 'Life-Threatening', desc: 'Immediate danger to life. Needs rapid response.', color: 'bg-red-100 text-red-800 border-red-300 animate-pulse' },
    ];

    // Smart Guidance Mapping
    const GUIDANCE_TIPS = {
        medical: "For mass casualties, please indicate the approximate number of injured in details.",
        fire: "Ensure you are at a safe distance before reporting. Do not enter burning structures.",
        flood: "If water level is rising rapidly, mark severity as CRITICAL immediately.",
        supply: "Specify if water or food is the primary need.",
        infrastructure: "Stay clear of damaged bridges or power lines."
    };

    const handleTypeSelect = (typeId) => {
        setFormData(prev => ({ ...prev, type: typeId }));
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        setTimeout(() => {
            addIncident({
                type: formData.type.toUpperCase(),
                severity: formData.severity,
                description: formData.description,
                lat: 28.6139 + (Math.random() - 0.5) * 0.01,
                lng: 77.2090 + (Math.random() - 0.5) * 0.01,
                locationName: 'Detected Location (GPS)',
                reporterId: currentUser?.id || 'guest-user',
            });
            setSubmitting(false);
            setShowSuccess(true); // Show success toast popup
        }, 1500);
    };


    const resetForm = () => {
        setShowSuccess(false);
        setStep(1);
        setFormData({ type: '', severity: 'HIGH', description: '', locationConfirmed: true });
    };

    return (
        <>
        {/* Success Modal Toast */}
        {showSuccess && (
            <SuccessToast
                onClose={resetForm}
                onNavigate={() => navigate('/dashboard')}
            />
        )}
        <div className="max-w-xl mx-auto py-6 px-4">
            
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold font-serif text-slate-900">Emergency Report</h2>
                <p className="text-sm text-slate-500">Step {step} of 2 • <span className="text-blue-600 font-medium">{step === 1 ? 'Identify Threat' : 'Details & Location'}</span></p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
                {step === 1 && (
                    <div className="p-6 animate-in slide-in-from-right duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <AlertOctagon className="w-5 h-5 mr-2 text-red-600" />
                            What type of emergency is it?
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.values(INCIDENT_TYPES).map((type) => {
                                const Icon = ICON_MAP[type.icon] || Info;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-xl hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all gap-3 text-center h-40 group"
                                    >
                                        <div className={cn("p-4 rounded-full text-white transition-transform group-hover:scale-110", type.color)}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-slate-700 group-hover:text-red-700">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="p-6 animate-in slide-in-from-right duration-300 space-y-6">
                        
                        {/* Selected Type Badge */}
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="text-sm text-slate-500 font-medium">Selected: <strong className="text-slate-900">{INCIDENT_TYPES[formData.type]?.label}</strong></span>
                            <button type="button" onClick={() => setStep(1)} className="text-xs text-blue-600 font-bold hover:underline">CHANGE</button>
                        </div>

                        {/* Smart Guidance Tip */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r text-xs text-blue-800 leading-relaxed font-medium">
                            <strong>Tip:</strong> {GUIDANCE_TIPS[formData.type] || "Provide as much detail as possible for faster response."}
                        </div>

                        {/* Severity Selector */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">How severe is it?</label>
                            <div className="space-y-3">
                                {SEVERITY_OPTIONS.map((level) => (
                                    <div 
                                        key={level.id}
                                        onClick={() => setFormData(prev => ({ ...prev, severity: level.id }))}
                                        className={cn(
                                            "cursor-pointer p-3 rounded-lg border-2 flex items-center transition-all",
                                            formData.severity === level.id 
                                                ? `border-slate-800 bg-slate-50 ring-1 ring-slate-800` 
                                                : "border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        <div className={cn("w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center shrink-0", 
                                            formData.severity === level.id ? "border-slate-900" : "border-slate-300"
                                        )}>
                                            {formData.severity === level.id && <div className="w-2 h-2 rounded-full bg-slate-900"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-slate-900">{level.label}</span>
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", level.color)}>
                                                    {level.id}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{level.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location & Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Location & Details</label>
                                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg text-blue-800 text-sm mb-3 border border-blue-100">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span>GPS Location Detected: <strong>Connaught Place, Sector 4</strong></span>
                                </div>
                                <textarea
                                    className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none min-h-[100px] text-sm font-medium resize-none"
                                    placeholder="Describe the situation briefly (optional)..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                             <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 px-6 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-200 disabled:opacity-70 disabled:scale-100"
                            >
                                {submitting ? 'Transmitting Alert...' : 'SEND EMERGENCY REPORT'}
                            </button>
                            <div className="mt-4 flex items-center justify-center text-xs text-slate-400 gap-1.5">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Report will be immediately visible to nearby response units.</span>
                            </div>
                        </div>

                    </form>
                )}
            </div>
        </div>
        </>
    );
};

export default SubmitReport;
