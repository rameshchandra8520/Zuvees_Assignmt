import { useState, useEffect } from 'react';
import { ordersApi, ridersApi } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: null,
    orderId: null
  });

  // Fetch orders and riders on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, ridersData] = await Promise.all([
          ordersApi.getAll(),
          ridersApi.getAll()
        ]);
        setOrders(ordersData);
        setRiders(ridersData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update order status
  const handleStatusUpdate = async (orderId, status, riderId = null) => {
    try {
      setUpdateStatus({ loading: true, error: null, orderId });

      // If status is "Shipped", a rider must be assigned
      if (status === 'Shipped' && !riderId) {
        setUpdateStatus({
          loading: false,
          error: 'Please select a rider when setting status to Shipped',
          orderId
        });
        return;
      }

      // Call API to update status
      const updatedOrder = await ordersApi.updateStatus(orderId, status, riderId);

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              status,
              rider_id: riderId,
              // Add rider_name from the response if it exists
              rider_name: updatedOrder.rider_name || (riderId && getRiderName(riderId)) || order.rider_name
            };
          }
          return order;
        })
      );

      setUpdateStatus({ loading: false, error: null, orderId: null });
    } catch (err) {
      console.error('Failed to update order status:', err);
      setUpdateStatus({
        loading: false,
        error: 'Failed to update status. Please try again.',
        orderId
      });
    }
  };

  // Helper function to get rider name by ID
  const getRiderName = (riderId) => {
    const rider = riders.find(r => r.id === riderId);
    return rider ? rider.name : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user_email || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{order.total}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'Paid' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                        ${order.status === 'Undelivered' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === 'Paid' ? (
                        <select 
                          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          disabled={updateStatus.loading && updateStatus.orderId === order.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(order.id, 'Shipped', parseInt(e.target.value));
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select Rider</option>
                          {riders.map(rider => (
                            <option key={rider.id} value={rider.id}>
                              {rider.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {order.rider_name || 'Not assigned'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {updateStatus.loading && updateStatus.orderId === order.id ? (
                        <div className="text-gray-400">Updating...</div>
                      ) : order.status === 'Paid' ? (
                        <div className="space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleStatusUpdate(order.id, 'Shipped', order.rider_id)}
                            disabled={!order.rider_id}
                          >
                            Ship
                          </button>
                        </div>
                      ) : order.status === 'Shipped' ? (
                        <div className="space-x-2">
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                          >
                            Mark Delivered
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleStatusUpdate(order.id, 'Undelivered')}
                          >
                            Mark Undelivered
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-400">No actions</div>
                      )}
                      
                      {updateStatus.error && updateStatus.orderId === order.id && (
                        <div className="text-red-500 text-xs mt-1">
                          {updateStatus.error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 