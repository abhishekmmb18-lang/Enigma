import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Play, Pause, SkipForward, SkipBack, Music, Clock as ClockIcon, AlertTriangle, Phone, Wine, Activity, Settings, ExternalLink } from 'lucide-react';

// --- Location Widget Component ---
const LocationWidget = () => {
    const [gps, setGps] = useState({ latitude: 0, longitude: 0, speed: 0 });

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                // Dynamic IP - uses hostname to support LAN access
                const res = await fetch(`http://${window.location.hostname}:5000/api/location`);
                const data = await res.json();
                setGps(data);
            } catch (e) {
                // ignore errors (e.g. server offline)
            }
        };

        const interval = setInterval(fetchLocation, 1000);
        return () => clearInterval(interval);
    }, []);

    const mapsUrl = `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;

    return (
        <div className="md:col-span-3 bg-blue-900/20 backdrop-blur-md rounded-3xl p-6 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-blue-900/30">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400 animate-pulse hidden md:block">
                    {/* Map Pin Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-blue-100 flex items-center gap-2">
                        <span className="md:hidden">🌍</span> Live GPS Tracking
                    </h3>
                    <div className="flex gap-4 text-blue-200/60 font-mono mt-1 text-sm md:text-base">
                        <span>LAT: {gps.latitude.toFixed(6)}</span>
                        <span>LON: {gps.longitude.toFixed(6)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                {/* Speed Removed */}

                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 text-sm ml-auto"
                >
                    Open Maps <ExternalLink size={16} />
                </a>
            </div>
        </div>
    );
};

// --- Main ProfileHome Component ---
const ProfileHome = ({ user, onLogout }) => {
    const { t } = useLanguage();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sensorData, setSensorData] = useState({ alcohol: 0, vibration: 0, type: 'Normal' });

    // Music App Logic
    const [musicApp, setMusicApp] = useState('spotify'); // spotify, ytmusic, apple, gaana
    const [showMusicSettings, setShowMusicSettings] = useState(false);

    const musicApps = {
        spotify: { name: 'Spotify', url: 'https://open.spotify.com', color: 'text-green-400', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
        ytmusic: { name: 'YouTube Music', url: 'https://music.youtube.com', color: 'text-red-400', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/YouTube_Music_icon.svg' },
        apple: { name: 'Apple Music', url: 'https://music.apple.com', color: 'text-pink-400', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_Music_logo.svg' },
        gaana: { name: 'Gaana', url: 'https://gaana.com', color: 'text-red-500', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Gaana_Logo.svg' }
    };

    // Clock Logic
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Sensor Polling logic
    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                const res = await fetch(`http://${window.location.hostname}:5000/api/road-data`);
                const data = await res.json();
                if (data.length > 0) {
                    const latest = data[0];
                    if (Date.now() - new Date(latest.created_at + "Z").getTime() < 5000) {
                        setSensorData({
                            alcohol: latest.alcohol || 0,
                            vibration: latest.vibration || 0,
                            type: latest.type || 'Normal'
                        });
                    }
                }
            } catch (err) { }
        };
        const interval = setInterval(fetchSensorData, 1000);
        return () => clearInterval(interval);
    }, []);

    const isHazard = sensorData.vibration > 0.8 || sensorData.type === 'Pothole' || sensorData.type === 'Accident';
    const isAlcoholHigh = sensorData.alcohol > 80;

    const handleLaunchMusic = () => {
        window.open(musicApps[musicApp].url, '_blank');
    };

    // --- ALERT SYSTEM LOGIC ---
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchAllStatus = async () => {
            try {
                const BASE_URL = `http://${window.location.hostname}:5000`;
                const tempAlerts = [];

                // 1. Alcohol
                const resAlc = await fetch(`${BASE_URL}/api/alcohol`);
                const alcData = await resAlc.json();
                if (alcData.value > 70) tempAlerts.push({ type: 'Alcohol', msg: 'High Alcohol Detected!', time: 'Now', color: 'bg-red-500' });

                // 2. Drowsiness
                const resDrowsy = await fetch(`${BASE_URL}/api/drowsiness`);
                const drowsyData = await resDrowsy.json();
                // Check current or latest history
                const isDrowsy = drowsyData.current ? drowsyData.current.isDrowsy : drowsyData.isDrowsy;
                if (isDrowsy) tempAlerts.push({ type: 'Drowsiness', msg: 'Driver Drowsy! Wake Up!', time: 'Now', color: 'bg-orange-500' });

                // 3. Potholes (Recent)
                const resRoad = await fetch(`${BASE_URL}/api/road-data`);
                const roadData = await resRoad.json();
                const now = Date.now();
                roadData.forEach(e => {
                    if ((e.type === 'Pothole' || e.type === 'Accident') && (now - new Date(e.created_at).getTime() < 30000)) {
                        tempAlerts.push({ type: e.type, msg: `${e.type} Detected Ahead!`, time: 'Just Now', color: 'bg-yellow-500' });
                    }
                });

                setAlerts(tempAlerts);

            } catch (e) { }
        };

        const interval = setInterval(fetchAllStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const hasAlerts = alerts.length > 0;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 text-white relative flex flex-col gap-6">

            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.full_name?.split(' ')[0] || user.username}
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">System Active & Monitoring</p>
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
                    <ClockIcon size={32} className="text-blue-400 animate-pulse" />
                    <div className="text-right">
                        <div className="text-3xl font-mono font-bold leading-none">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className={`grid grid-cols-1 ${hasAlerts ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 transition-all duration-500`}>

                {/* 1. MUSIC (Always 1 Col) */}
                <div className="col-span-1 bg-gray-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:bg-gray-800/60 transition-colors relative h-full min-h-[250px]">
                    {/* Music Content */}
                    <div className="absolute top-4 right-4"><Music size={20} className="text-gray-600" /></div>
                    <div className="mt-auto">
                        <h3 className="font-bold text-xl">Music</h3>
                        <button onClick={handleLaunchMusic} className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600 py-3 rounded-xl transition-all border border-blue-500/30 font-medium text-sm">
                            Open {musicApps[musicApp].name}
                        </button>
                    </div>
                </div>

                {/* 2. EMERGENCY (Shrinks if Alerts present) */}
                <div className={`${hasAlerts ? 'col-span-1 lg:col-span-2' : 'col-span-1 lg:col-span-2'} bg-red-900/20 backdrop-blur-md rounded-3xl p-6 border border-red-500/30 flex flex-col justify-between hover:bg-red-900/30 transition-all duration-500 h-full min-h-[250px]`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-red-100">Emergency</h3>
                            <p className="text-red-200/60 text-sm">Quick Access</p>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-full text-red-500"><Phone size={24} /></div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <a href="tel:112" className="flex-1 bg-red-600 hover:bg-red-500 rounded-xl flex flex-col items-center justify-center p-3 transition-colors shadow-lg">
                            <span className="text-2xl font-bold">112</span>
                            <span className="text-[10px] opacity-75 uppercase">Police</span>
                        </a>
                        <button
                            onClick={async () => {
                                try {
                                    alert("Triggering SOS...");
                                    await fetch(`http://${window.location.hostname}:5000/api/sos`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'manual' })
                                    });
                                    alert("SOS Sent!");
                                } catch (e) { alert("Error sending SOS"); }
                            }}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl flex flex-col items-center justify-center p-3 transition-colors border border-white/10"
                        >
                            <span className="text-xl font-bold">SOS</span>
                            <span className="text-[10px] opacity-50 uppercase">Trigger</span>
                        </button>
                    </div>
                </div>

                {/* 3. NOTIFICATIONS (Visible only if Alerts > 0) */}
                {hasAlerts && (
                    <div className="col-span-1 bg-gray-900/80 backdrop-blur-xl rounded-3xl p-4 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-slide-in h-full min-h-[250px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <h3 className="font-bold text-red-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <AlertTriangle size={18} /> Active Alerts
                            </h3>
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {alerts.map((alert, idx) => (
                                <div key={idx} className={`${alert.color}/10 border-l-2 ${alert.color.replace('bg-', 'border-')} p-3 rounded-r-lg`}>
                                    <div className={`text-xs ${alert.color.replace('bg-', 'text-')} font-bold uppercase`}>{alert.type}</div>
                                    <div className="text-sm font-medium leading-snug my-1">{alert.msg}</div>
                                    <div className="text-[10px] text-gray-400 text-right">{alert.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* GPS Widget */}
            <div className="mt-0">
                <LocationWidget />
            </div>
        </div>
    );
};
export default ProfileHome;
