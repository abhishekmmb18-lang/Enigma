

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
    useEffect(() => {
        const fetchLoc = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/location`);
                const json = await res.json();
                setLocation({ lat: json.latitude, lon: json.longitude });
            } catch (e) {
                console.error("Loc fetch error", e);
            }
        };
        const interval = setInterval(fetchLoc, 2000);
        return () => clearInterval(interval);
    }, []);

    // Check for Alerts (Vibration & Pothole)
    useEffect(() => {
        const checkAlerts = async () => {
            // 1. Check Pothole
            let isPothole = false;
            try {
                const res = await fetch('http://localhost:5002/status');
                const json = await res.json();
                isPothole = json.detected;
            } catch (e) { /* ignore */ }

            // 2. Check Vibration
            const isVibHigh = current.left > 80 || current.right > 80;

            if (isPothole || isVibHigh) {
                const newAlert = {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString(),
                    type: isPothole && isVibHigh ? "CRITICAL: Pothole & Impact" : (isPothole ? "Pothole Detected" : "Severe Vibration"),
                    location: `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
                    color: "text-red-500"
                };

                setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5
            }
        };
        const interval = setInterval(checkAlerts, 1000);
        return () => clearInterval(interval);
    }, [current, location]);

    return (
        <div className="p-8 w-full min-h-screen text-white animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Road Quality Monitor (Suspension)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pothole Detection Camera Feed */}
                <div className="md:col-span-2 bg-gray-900/50 p-6 rounded-2xl border border-yellow-500/30">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        📷 Pothole Detection Feed (v2.0)
                        <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">Live Analysis</span>
                    </h3>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 max-w-xl mx-auto">
                        <img
                            src="http://localhost:5002/video_feed"
                            alt="Pothole Detection Stream"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x400/000000/FFF?text=Camera+Offline";
                            }}
                        />
                        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded text-xs text-green-400">
                            ● Online
                        </div>
                    </div>
                </div>

                {/* Left Wheel */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-blue-500/30">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Left Wheel Vibration</h3>
                    <div className="text-5xl font-mono mb-4">{current.left.toFixed(1)}</div>
                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <YAxis domain={[0, 100]} hide />
                                <Line type="monotone" dataKey="left" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Wheel */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-red-500/30">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Right Wheel Vibration</h3>
                    <div className="text-5xl font-mono mb-4">{current.right.toFixed(1)}</div>
                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <YAxis domain={[0, 100]} hide />
                                <Line type="monotone" dataKey="right" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
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
