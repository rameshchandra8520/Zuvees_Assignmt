import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'picked_up'
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    let unsubscribe = null;
    
    if (user) {
      unsubscribe = fetchOrdersFromFirestore(user.uid);
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [navigate, user, isAuthenticated]);

  const fetchOrdersFromFirestore = (riderId) => {
    setLoading(true);
    try {
      console.log("Fetching orders from Firestore for rider:", riderId);
      
      // Create a query to get the rider's assigned orders
      const ordersRef = collection(db, 'orders');
      
      const q = query(
        ordersRef,
        where('riderId', '==', riderId),
        where('status', 'in', ['assigned', 'picked_up']),
        orderBy('createdAt', 'desc')
      );
      
      // Set up real-time listener for orders
      const unsubscribeOrders = onSnapshot(
        q,
        (snapshot) => {
          const ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Orders fetched from Firestore:", ordersList);
          setOrders(ordersList);
          setLoading(false);
          setRefreshing(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching orders from Firestore:", err);
          setError("Error fetching orders: " + (err.message || "Unknown error"));
          setLoading(false);
          setRefreshing(false);
          
          // If we can't get data from Firestore, use fallback data after a delay
          setTimeout(() => {
            setOrders([
              {
                id: 'fallback-1',
                orderNumber: 'FB12345',
                status: 'assigned',
                riderId: riderId,
                createdAt: new Date().toISOString(),
                items: [
                  { name: 'Fallback Game 1', quantity: 1, price: 59.99 }
                ],
                customer: {
                  name: 'Fallback Customer',
                  address: '123 Fallback St, City, ST 12345',
                  phone: '123-456-7890'
                },
                pickup: {
                  name: 'Game Store (Fallback)',
                  address: '456 Store St, City, ST 12345',
                  phone: '987-654-3210'
                }
              }
            ]);
            setError("Using fallback data due to Firestore connection issues");
          }, 1000);
        }
      );
      
      return unsubscribeOrders;
    } catch (err) {
      console.error("Error setting up Firestore listener:", err);
      setError("Error setting up orders listener: " + (err.message || "Unknown error"));
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  const handleRefresh = () => {
    if (!refreshing && user) {
      setRefreshing(true);
      
      // Clear existing listener and create a new one
      let unsubscribe = fetchOrdersFromFirestore(user.uid);
      
      // Auto reset the refreshing state after 2 seconds
      refreshTimerRef.current = setTimeout(() => {
        setRefreshing(false);
      }, 2000);
      
      return unsubscribe;
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (!orderId) {
        setError("Cannot update order: Invalid order ID");
        return;
      }
      
      // First update local state for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {
                ...order, 
                status: newStatus,
                statusUpdatedAt: new Date().toISOString()
              } 
            : order
        )
      );
      
      // Then update Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        statusUpdatedAt: new Date().toISOString()
      });
      
      console.log(`Order ${orderId} status updated to ${newStatus} in Firestore`);
    } catch (err) {
      console.error("Failed to update order status in Firestore:", err);
      setError(`Failed to update order status: ${err.message || "Unknown error"}`);
      
      // Revert the local state change if Firestore update failed
      handleRefresh();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle navigation
    } catch (err) {
      setError("Error signing out: " + err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'picked_up':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const filteredOrders = orders.filter(order => 
    activeTab === 'all' || order.status === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Bar */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 14C20.6569 14 22 12.6569 22 11C22 9.34315 20.6569 8 19 8C17.3431 8 16 9.34315 16 11C16 12.6569 17.3431 14 19 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 14C6.65685 14 8 12.6569 8 11C8 9.34315 6.65685 8 5 8C3.34315 8 2 9.34315 2 11C2 12.6569 3.34315 14 5 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 11H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 14V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 4H16L14 8H10L8 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-xl font-bold">Rider Deliveries</h1>
            </div>
            {user && (
              <div className="flex items-center">
                <div className="hidden md:block mr-4">
                  <span className="font-medium">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        {/* User Info Banner */}
        <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-300 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
          <span>Logged in as {user?.displayName || user?.email} (hardcoded login)</span>
        </div>
      
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-700 hover:text-red-900"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Pull-to-refresh indicator (simulated with button) */}
        <div className="mb-4 flex justify-center">
          <button 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-blue-600 flex items-center focus:outline-none disabled:opacity-50"
          >
            <svg 
              className={`h-5 w-5 mr-1 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Pull to refresh'}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              To Pickup
              {orders.filter(o => o.status === 'assigned').length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'assigned').length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('picked_up')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'picked_up'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Transit
              {orders.filter(o => o.status === 'picked_up').length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'picked_up').length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Orders
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {orders.length}
              </span>
            </button>
          </nav>
        </div>
        
        {/* Orders List */}
        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500">Loading your deliveries...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="mt-10 flex flex-col items-center justify-center h-64">
                <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 15a4 4 0 004 4h10a4 4 0 004-4v-4a4 4 0 00-4-4H7a4 4 0 00-4 4v4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 2v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 2v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 10h18" />
                </svg>
                <p className="mt-4 text-lg text-gray-500">
                  {activeTab === 'all' 
                    ? "You don't have any orders yet" 
                    : `No ${activeTab === 'assigned' ? 'pickups' : 'in-transit deliveries'} at the moment`
                  }
                </p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status === 'assigned' ? 'To Pickup' : 
                       order.status === 'picked_up' ? 'In Transit' : 
                       order.status}
                    </span>
                  </div>
                  
                  <div className="px-4 py-5 sm:px-6">
                    <div className="mb-4 border-l-4 border-blue-500 bg-blue-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Pickup Information</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>{order.pickup?.name || 'Game Vault Store'}</p>
                            <p>{order.pickup?.address || '123 Gaming Street'}</p>
                            <p>{order.pickup?.phone || '+1 555-GAME'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4 border-l-4 border-green-500 bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Delivery Information</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>{order.customer?.name || 'Customer Name'}</p>
                            <p>{order.customer?.address || 'Customer Address'}</p>
                            <p>{order.customer?.phone || 'Customer Phone'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">Order Items</h4>
                      <ul className="mt-2 divide-y divide-gray-200">
                        {order.items?.map((item, index) => (
                          <li key={index} className="py-3 flex justify-between">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900">{item.quantity}x</span>
                              <span className="ml-2 text-sm text-gray-900">{item.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">${item.price?.toFixed(2)}</span>
                          </li>
                        )) || (
                          <li className="py-3 text-sm text-gray-500">No item details available</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      {order.status === 'assigned' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'picked_up')}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Mark as Picked Up
                        </button>
                      ) : order.status === 'picked_up' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Mark as Delivered
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      
      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10 md:hidden">
        <div className="flex justify-around">
          <button 
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'assigned' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">To Pickup</span>
            {orders.filter(o => o.status === 'assigned').length > 0 && (
              <span className="absolute top-1 ml-6 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {orders.filter(o => o.status === 'assigned').length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('picked_up')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'picked_up' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 16V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1z" />
            </svg>
            <span className="text-xs">In Transit</span>
            {orders.filter(o => o.status === 'picked_up').length > 0 && (
              <span className="absolute top-1 ml-6 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {orders.filter(o => o.status === 'picked_up').length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-xs">All Orders</span>
            {orders.length > 0 && (
              <span className="absolute top-1 ml-6 bg-gray-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={handleRefresh}
            className="flex-1 py-3 flex flex-col items-center text-gray-500 hover:text-gray-700"
          >
            <svg className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs">Refresh</span>
          </button>
        </div>
      </nav>
    </div>
  );
} 