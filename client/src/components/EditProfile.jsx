import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const EditProfile = ({ user, onCancel, onUpdate }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        profile_picture: user.profile_picture || '',
        vehicle_details: user.vehicle_details || '',
        contact_details: user.contact_details || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profile_picture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/user/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}. Please restart the server if you just added this feature.`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            onUpdate(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl text-white mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('edit_profile')}
            </h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full border-4 border-purple-500 overflow-hidden bg-gray-800 flex items-center justify-center relative group">
                        {formData.profile_picture ? (
                            <img src={formData.profile_picture} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <span className="text-xs font-semibold">{t('change')}</span>
                        </div>
                    </div>
                    <label className="block">
                        <span className="sr-only">Choose profile photo</span>
                        <input type="file" accept="image/*" onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-purple-600 file:text-white
                            hover:file:bg-purple-700
                            cursor-pointer
                        "/>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('full_name')}</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                            placeholder={t('enter_name')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('contact_details')}</label>
                        <input
                            type="text"
                            name="contact_details"
                            value={formData.contact_details}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                            placeholder={t('enter_contact')}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('vehicle_details')}</label>
                    <textarea
                        name="vehicle_details"
                        value={formData.vehicle_details}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                        placeholder={t('enter_vehicle')}
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all transform hover:scale-105"
                    >
                        {loading ? t('saving') : t('save_changes')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
