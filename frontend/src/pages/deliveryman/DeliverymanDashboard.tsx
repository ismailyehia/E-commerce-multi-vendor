import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTruck, HiOutlineCheck, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import MapTracker from '../../components/MapTracker';

const statusColors: Record<string, string> = {
    assigned: 'bg-yellow-100 text-yellow-800', accepted: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800', in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800'
};

const formatAddress = (addr: any) => {
    if (!addr) return 'no_address_provided'; // Will be translated in JSX
    if (typeof addr === 'string') {
        try {
            const parsed = JSON.parse(addr);
            return formatAddress(parsed);
        } catch { return addr; }
    }
    const { street, city, state, zipCode, country } = addr;
    return [street, city, state, zipCode, country].filter(Boolean).join(', ');
};

const DeliverymanDashboard = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my' | 'available'>('my');
    const [filter, setFilter] = useState('');
    const [showMapFor, setShowMapFor] = useState<string | null>(null);
    const [markingMode, setMarkingMode] = useState<Record<string, 'driver' | 'destination'>>({});
    const [pendingLocations, setPendingLocations] = useState<Record<string, { lat: number; lng: number }>>({});
    const [saving, setSaving] = useState<string | null>(null);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [myRes, availableRes] = await Promise.all([
                api.get('/delivery/assigned'),
                api.get('/delivery/available')
            ]);
            setDeliveries(Array.isArray(myRes.data.deliveries) ? myRes.data.deliveries : (Array.isArray(myRes.data) ? myRes.data : []));
            setAvailableOrders(Array.isArray(availableRes.data) ? availableRes.data : []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        const load = async () => {
            await fetchData();
            // If nothing is assigned but there are available orders, switch to that tab
            // This helps the user see that orders exist right away
        };
        load();
    }, []);

    useEffect(() => {
        if (!loading && deliveries.length === 0 && availableOrders.length > 0) {
            setActiveTab('available');
        }
    }, [loading, deliveries.length, availableOrders.length]);

    const handleClaim = async (orderId: string) => {
        try {
            await api.post(`/delivery/claim/${orderId}`);
            toast.success(t('order_claimed') || 'Order claimed');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('failed_to_claim') || 'Failed to claim order');
        }
    };

    const handleAccept = async (id: string) => {
        try { await api.put(`/delivery/${id}/accept`); toast.success(t('accepted')); fetchData(); }
        catch { toast.error(t('failed_generic')); }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try { await api.put(`/delivery/${id}/status`, { status }); toast.success(t('status_updated')); fetchData(); }
        catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic')); }
    };

    const handleUpdateLocation = async (id: string) => {
        if (!navigator.geolocation) return toast.error(t('geolocation_not_supported'));
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await api.put(`/delivery/${id}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    toast.success(t('location_updated'));
                } catch { toast.error(t('failed_generic')); }
            },
            () => toast.error(t('location_access_denied'))
        );
    };

    const handleManualLocationUpdate = (id: string, lat: number, lng: number) => {
        setPendingLocations(prev => ({ ...prev, [id]: { lat, lng } }));
    };

    const handleMarkOnMap = (item: any) => {
        if (showMapFor === item.id) {
            setShowMapFor(null);
        } else {
            setShowMapFor(item.id);
            // Default to 'destination' mode if destination is not yet set
            if (!item.deliveryLocationLat || item.deliveryLocationLat === 0) {
                setMarkingMode(prev => ({ ...prev, [item.id]: 'destination' }));
            } else {
                setMarkingMode(prev => ({ ...prev, [item.id]: 'driver' }));
            }
        }
    };

    const handleSaveLocation = async (id: string) => {
        const pending = pendingLocations[id];
        if (!pending) return;

        const isDest = markingMode[id] === 'destination';
        setSaving(id);
        try {
            await api.put(`/delivery/${id}/location`, { ...pending, isDestination: isDest });
            toast.success(isDest ? (t('destination_marked_success') || 'Destination marked') : (t('location_updated_shared') || 'Location updated'));
            setPendingLocations(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            fetchData();
        } catch {
            toast.error(t('failed_generic') || 'Failed to update location');
        } finally {
            setSaving(null);
        }
    };

    const filtered = activeTab === 'my'
        ? (filter ? deliveries.filter(d => d.status === filter) : deliveries)
        : availableOrders;

    const pendingCount = deliveries.filter(d => d.status === 'assigned').length;
    const activeCount = deliveries.filter(d => ['accepted', 'picked_up', 'in_transit'].includes(d.status)).length;
    const completedCount = deliveries.filter(d => d.status === 'delivered').length;

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('deliveryman_panel')}</h1>
                <button onClick={fetchData} className="text-sm text-primary-600 font-medium hover:underline">{t('refresh') || 'Refresh'}</button>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {[
                    { label: t('available'), value: availableOrders.length, color: 'bg-primary-50', icon: HiOutlineTruck, textColor: 'text-primary-600' },
                    { label: t('to_accept'), value: pendingCount, color: 'bg-yellow-50', icon: HiOutlineClock, textColor: 'text-yellow-600' },
                    { label: t('active'), value: activeCount, color: 'bg-blue-50', icon: HiOutlineTruck, textColor: 'text-blue-600' },
                    { label: t('completed'), value: completedCount, color: 'bg-green-50', icon: HiOutlineCheck, textColor: 'text-green-600' }
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card p-4 ${isRtl ? 'text-right' : ''}`}>
                        <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-2 ${isRtl ? 'mr-0' : ''}`}><s.icon className={`w-5 h-5 ${s.textColor}`} /></div>
                        <p className="text-sm text-dark-400">{s.label}</p>
                        <p className="text-2xl font-bold text-dark-900">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-dark-100">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'my' ? 'text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
                >
                    {t('my_deliveries')}
                    {activeTab === 'my' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'available' ? 'text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
                >
                    {t('available_orders')}
                    {availableOrders.length > 0 && <span className={`${isRtl ? 'mr-1.5' : 'ml-1.5'} px-1.5 py-0.5 bg-primary-100 text-primary-600 text-[10px] rounded-full`}>{availableOrders.length}</span>}
                    {activeTab === 'available' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
            </div>

            {/* Filter (only for My Deliveries) */}
            {activeTab === 'my' && (
                <div className="flex gap-2 overflow-x-auto">
                    {['', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                            {s ? t(s) : t('all')}
                        </button>
                    ))}
                </div>
            )}

            {/* Deliveries List */}
            <div className="space-y-4">
                {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-5 animate-pulse"><div className="h-24 skeleton rounded-xl" /></div>)
                    : filtered.length === 0 ? (
                        <div className="text-center py-16"><HiOutlineTruck className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-dark-700">{activeTab === 'my' ? t('no_deliveries') : t('no_available_orders')}</h3>
                            <p className="text-dark-400">{activeTab === 'my' ? t('check_available_desc') : t('check_back_later_desc')}</p>
                        </div>
                    ) : filtered.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card p-5 ${isRtl ? 'text-right' : ''}`}>
                            <div className={`flex items-start justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div>
                                    <p className="font-semibold text-dark-800">{t('order')}: {activeTab === 'my' ? item.order?.orderNumber : item.orderNumber}</p>
                                    <p className="text-sm text-dark-400 mt-1">
                                        {(activeTab === 'my' ? (item.order?.shippingAddress || item.deliveryLocationAddress) : item.shippingAddress)
                                            ? formatAddress(activeTab === 'my' ? (item.order?.shippingAddress || item.deliveryLocationAddress) : item.shippingAddress)
                                            : t('no_address_provided')}
                                    </p>
                                    <p className="text-xs text-dark-400 mt-1">{t('customer')}: {item.user?.name || item.order?.user?.name || t('guest')} ({item.user?.phone || item.order?.user?.phone || t('no_phone')})</p>
                                </div>
                                {activeTab === 'my' ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[item.status] || ''}`}>{t(item.status) || item.status?.replace(/_/g, ' ')}</span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{t('available')}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {activeTab === 'available' ? (
                                    <button onClick={() => handleClaim(item.id)} className="btn-primary py-2 text-sm">{t('claim_for_delivery')}</button>
                                ) : (
                                    <>
                                        {item.status === 'assigned' && <button onClick={() => handleAccept(item.id)} className="btn-primary py-2 text-sm">{t('accept_delivery')}</button>}
                                        {item.status === 'accepted' && <button onClick={() => handleUpdateStatus(item.id, 'picked_up')} className="btn-primary py-2 text-sm">{t('mark_picked_up')}</button>}
                                        {item.status === 'picked_up' && <button onClick={() => handleUpdateStatus(item.id, 'in_transit')} className="btn-primary py-2 text-sm">{t('start_delivery')}</button>}
                                        {item.status === 'in_transit' && <button onClick={() => handleUpdateStatus(item.id, 'delivered')} className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlineCheck className="w-4 h-4" /> {t('mark_delivered')}</button>}
                                        {['accepted', 'picked_up', 'in_transit'].includes(item.status) && (
                                            <div className="w-full space-y-3">
                                                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <button onClick={() => handleUpdateLocation(item.id)} className="btn-secondary py-2 text-sm flex-1 flex items-center justify-center gap-1">
                                                        <HiOutlineLocationMarker className="w-4 h-4" /> {t('auto_gps') || 'Auto GPS'}
                                                    </button>
                                                    <button onClick={() => handleMarkOnMap(item)} className="btn-secondary py-2 text-sm flex-1 flex items-center justify-center gap-1">
                                                        <HiOutlineTruck className="w-4 h-4" /> {showMapFor === item.id ? (t('hide_map') || 'Hide Map') : (t('mark_on_map') || 'Mark on Map')}
                                                    </button>
                                                </div>
                                                {showMapFor === item.id && (
                                                    <div className="space-y-4">
                                                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`flex items-center gap-2 bg-dark-50 p-1 rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                                <button
                                                                    onClick={() => setMarkingMode(prev => ({ ...prev, [item.id]: 'driver' }))}
                                                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${markingMode[item.id] !== 'destination' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:bg-white/50'}`}
                                                                >
                                                                    {t('mark_my_location') || 'Mark My Location'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setMarkingMode(prev => ({ ...prev, [item.id]: 'destination' }))}
                                                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${markingMode[item.id] === 'destination' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-500 hover:bg-white/50'}`}
                                                                >
                                                                    {t('mark_destination') || 'Mark Destination'}
                                                                </button>
                                                            </div>
                                                            {pendingLocations[item.id] && (
                                                                <button
                                                                    onClick={() => handleSaveLocation(item.id)}
                                                                    disabled={saving === item.id}
                                                                    className="btn-primary py-1 px-4 text-xs flex items-center gap-1 shadow-lg animate-pulse"
                                                                >
                                                                    {saving === item.id ? t('saving') : <><HiOutlineCheck className="w-3 h-3" /> {t('confirm_update')} {markingMode[item.id] === 'destination' ? t('destination') : t('location')}</>}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <MapTracker
                                                            readOnly={false}
                                                            driverLocation={markingMode[item.id] === 'destination' ? ({ lat: item.currentLocationLat || 0, lng: item.currentLocationLng || 0 }) : (pendingLocations[item.id] || { lat: item.currentLocationLat || 0, lng: item.currentLocationLng || 0 })}
                                                            destination={markingMode[item.id] === 'destination' ? (pendingLocations[item.id] || { lat: item.deliveryLocationLat || 0, lng: item.deliveryLocationLng || 0 }) : { lat: item.deliveryLocationLat || 0, lng: item.deliveryLocationLng || 0 }}
                                                            onMapClick={(lat, lng) => handleManualLocationUpdate(item.id, lat, lng)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
            </div>
        </div>
    );
};

export default DeliverymanDashboard;
