

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RoadMonitor = () => {
    const [data, setData] = useState([]);
    const [current, setCurrent] = useState({ left: 0, right: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/vibration`);
                const json = await res.json();

                setCurrent(json);

                setData(prev => {
                    const newData = [...prev, {
                        time: new Date().toLocaleTimeString(),
                        left: json.left,
                        right: json.right
                    }];
                    if (newData.length > 20) newData.shift(); // Keep last 20 points
                    return newData;
                });
            } catch (err) {
                console.error("Vibration fetch failed", err);
            }
        };
        const interval = setInterval(fetchData, 200);
        return () => clearInterval(interval);
    }, []);

    const [alerts, setAlerts] = useState([]);
    const [location, setLocation] = useState({ lat: 0, lon: 0 });

    // Fetch Location
    // 1. Fetch Location from Server (Hardware OR Browser)
    useEffect(() => {
        const fetchLoc = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/location`);
                const json = await res.json();
                if (json.latitude || json.longitude) {
                    setLocation({ lat: json.latitude, lon: json.longitude });
                }
            } catch (e) {
                console.error("Loc fetch error", e);
            }
        };
        const interval = setInterval(fetchLoc, 2000);
        return () => clearInterval(interval);
    }, []);

    // 2. Publish Browser Location (Fallback for missing Hardware GPS)
    useEffect(() => {
        if ("geolocation" in navigator) {
            const pushLoc = () => {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude, speed } = position.coords;
                    // Send to Server to identify as the "Car's Location"
                    // This allows the Phone/Laptop to act as the GPS module
                    fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/location`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude, speed: speed || 0 })
                    }).catch(() => { });
                }, (err) => console.log("Browser Geo Error:", err.message), { enableHighAccuracy: true });
            };
            const interval = setInterval(pushLoc, 4000); // Sync every 4s
            pushLoc(); // Initial call
            return () => clearInterval(interval);
        }
    }, []);

    // Fetch Last 20 Alerts from Server History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/road-data`);
                const json = await res.json();

                const history = json.slice(0, 20).map(item => ({
                    id: item.id,
                    type: item.type,
                    location: `${item.latitude?.toFixed(4) || '0.0000'}, ${item.longitude?.toFixed(4) || '0.0000'}`,
                    time: item.created_at ? new Date(item.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString() : 'Just Now',
                    color: (item.type && (item.type.includes('Critical') || item.type.includes('SOS'))) ? 'text-red-500 font-bold' :
                        (item.type && item.type.includes('Alcohol')) ? 'text-purple-400 font-bold' :
                            (item.type && item.type.includes('Drowsiness')) ? 'text-orange-500 font-bold' :
                                (item.type && item.type.includes('Pothole')) ? 'text-yellow-400' : 'text-blue-300'
                }));
                setAlerts(history);
            } catch (e) {
                console.error("History fetch error", e);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 2000); // Update every 2s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 w-full min-h-screen text-white animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Road Quality Monitor (Suspension)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Pothole Detection Camera Feed (Now 1/3 width on large screens) */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-yellow-500/30 flex flex-col justify-between min-h-[300px]">
                    <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                            📷 Pothole Feed
                        </h3>
                        {/* Live Badge moved below title or kept compact */}
                        <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full w-fit mb-4 block">Live Analysis V2.0</span>
                    </div>

                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 w-full shadow-lg">
                        <img
                            src="http://localhost:5002/video_feed"
                            alt="Pothole Detection Stream"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x400/000000/FFF?text=Camera+Offline";
                            }}
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-[10px] text-green-400 backdrop-blur-sm border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-4 text-center">AI Pattern Recognition Active</p>
                </div>

                {/* Vibration Stats Container (Takes remaining space) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Wheel */}
                    <div className={`p-6 rounded-2xl border transition-colors ${current.left >= 0.8 ? 'bg-red-900/40 border-red-500 animate-pulse' : current.left >= 0.5 ? 'bg-orange-900/20 border-orange-500/50' : 'bg-gray-900/50 border-blue-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-xl font-bold ${current.left >= 0.8 ? 'text-red-400' : current.left >= 0.5 ? 'text-orange-400' : 'text-blue-400'}`}>Left Suspension</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${current.left >= 0.8 ? 'bg-red-500 text-white' : current.left >= 0.5 ? 'bg-orange-500 text-white' : 'bg-green-500/20 text-green-400'}`}>
                                {current.left >= 0.8 ? 'CRITICAL' : current.left >= 0.5 ? 'MAJOR' : 'NORMAL'}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-mono font-bold text-white">{current.left.toFixed(2)}</span> {/* Fixed to 2 decimal places */}
                            <span className="text-sm text-gray-400">G-Force</span>
                        </div>
                        <div className="h-40 w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[0, 1.2]} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                                    <Line type="monotone" dataKey="left" stroke={current.left >= 0.8 ? '#ef4444' : '#3b82f6'} strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center text-sm font-medium opacity-80">
                            {current.left >= 0.8 ? '⚠️ CRITICAL IMPACT DETECTED' : current.left >= 0.5 ? '⚠️ Major Vibration Warning' : '✅ Road Condition: Good'}
                        </div>
                    </div>

                    {/* Right Wheel */}
                    <div className={`p-6 rounded-2xl border transition-colors ${current.right >= 0.8 ? 'bg-red-900/40 border-red-500 animate-pulse' : current.right >= 0.5 ? 'bg-orange-900/20 border-orange-500/50' : 'bg-gray-900/50 border-red-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-xl font-bold ${current.right >= 0.8 ? 'text-red-400' : current.right >= 0.5 ? 'text-orange-400' : 'text-red-400'}`}>Right Suspension</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${current.right >= 0.8 ? 'bg-red-500 text-white' : current.right >= 0.5 ? 'bg-orange-500 text-white' : 'bg-green-500/20 text-green-400'}`}>
                                {current.right >= 0.8 ? 'CRITICAL' : current.right >= 0.5 ? 'MAJOR' : 'NORMAL'}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-mono font-bold text-white">{current.right.toFixed(2)}</span>
                            <span className="text-sm text-gray-400">G-Force</span>
                        </div>
                        <div className="h-40 w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[0, 1.2]} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                                    <Line type="monotone" dataKey="right" stroke={current.right >= 0.8 ? '#ef4444' : '#ef4444'} strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center text-sm font-medium opacity-80">
                            {current.right >= 0.8 ? '⚠️ CRITICAL IMPACT DETECTED' : current.right >= 0.5 ? '⚠️ Major Vibration Warning' : '✅ Road Condition: Good'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="mt-8 bg-red-900/20 border border-red-500/50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    ⚠️ Road Hazards Detected
                </h3>
                {alerts.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No hazards detected recently. Drive safe! 🟢</div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border-l-4 border-red-500">
                                <div>
                                    <div className={`font-bold ${alert.color}`}>{alert.type}</div>
                                    <div className="text-xs text-gray-400">GPS: {alert.location}</div>
                                </div>
                                <div className="text-sm font-mono text-gray-300">{alert.time}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-center text-gray-400 text-sm mt-8">
                Dual MPU-6050 Configuration | Left (0x68) | Right (0x69)
            </p>
        </div>
    );
};

export default RoadMonitor;
