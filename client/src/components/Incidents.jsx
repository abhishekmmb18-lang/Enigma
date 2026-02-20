import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Clock, ShieldAlert, Activity, Moon, Beer } from 'lucide-react';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                // Use VITE_SERVER_URL if available, else localhost
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/road-data`);
                const data = await res.json();
                // Show ALL incidents (removed filter)
                // Filter out 'Unknown' if necessary, but generally show everything logged
                setIncidents(data);
            } catch (e) {
                console.error("Failed to fetch incidents", e);
            }
        };

        fetchIncidents();
        const interval = setInterval(fetchIncidents, 2000);
        return () => clearInterval(interval);
    }, []);

    const getIncidentStyle = (type) => {
        if (!type) return { color: 'bg-gray-800 border-gray-600', icon: <AlertTriangle /> };
        if (type.includes('SOS')) return { color: 'bg-red-900/40 border-red-500 shadow-red-900/20', text: 'text-red-500', icon: <ShieldAlert /> };
        if (type.includes('Alcohol')) return { color: 'bg-purple-900/40 border-purple-500 shadow-purple-900/20', text: 'text-purple-400', icon: <Beer /> };
        if (type.includes('Drowsiness')) return { color: 'bg-orange-900/40 border-orange-500 shadow-orange-900/20', text: 'text-orange-500', icon: <Moon /> };
        if (type.includes('Critical')) return { color: 'bg-red-900/20 border-red-400', text: 'text-red-400', icon: <Activity /> };
        if (type.includes('Pothole')) return { color: 'bg-yellow-900/20 border-yellow-500', text: 'text-yellow-400', icon: <AlertTriangle /> };
        return { color: 'bg-blue-900/20 border-blue-500', text: 'text-blue-400', icon: <AlertTriangle /> };
    };

    return (
        <div className="p-4 md:p-8 w-full min-h-screen text-white animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
                    <AlertTriangle size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Incident Log</h1>
                    <p className="text-gray-400">Comprehensive history of all automated and manual alerts.</p>
                </div>
            </div>

            {incidents.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-gray-500 text-lg">No active incidents reported.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {incidents.map((incident, index) => {
                        const style = getIncidentStyle(incident.type);
                        return (
                            <div key={index} className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-white/5 ${style.color}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full bg-black/20 ${style.text}`}>
                                        {style.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${style.text}`}>
                                            {incident.type}
                                        </h3>
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2 text-sm text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={16} />
                                                {/* UTC to Local Fix */}
                                                {incident.created_at ? new Date(incident.created_at.replace(' ', 'T') + 'Z').toLocaleString() : 'Date Unknown'}
                                            </span>
                                            {incident.latitude && (
                                                <span className="flex items-center gap-1.5 font-mono">
                                                    <MapPin size={16} />
                                                    {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                                                </span>
                                            )}
                                            {incident.vibration > 0 && incident.type.includes('Vibration') && (
                                                <span className="flex items-center gap-1.5">
                                                    <Activity size={16} />
                                                    Force: {incident.vibration.toFixed(2)}G
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {incident.latitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold border border-white/10 transition-colors whitespace-nowrap"
                                    >
                                        View Map
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Incidents;
