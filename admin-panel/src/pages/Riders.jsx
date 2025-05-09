import { useState, useEffect } from 'react';
import { ridersApi } from '../services/api';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    error: null
  });
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedRiderOrders, setSelectedRiderOrders] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch riders on component mount
  useEffect(() => {
    fetchRiders();
  }, []);

  // Fetch riders from API
  const fetchRiders = async () => {
    try {
      setLoading(true);
      const data = await ridersApi.getAll();
      setRiders(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch riders:', err);
      setError('Failed to load riders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  // Submit rider form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitStatus({ loading: true, error: null });
      
      // Validate form
      if (!formValues.name.trim() || !formValues.email.trim()) {
        setSubmitStatus({
          loading: false,
          error: 'Name and email are required'
        });
        return;
      }
      
      // Submit to API
      await ridersApi.create(formValues);
      
      // Reset form and refresh riders
      setFormValues({
        name: '',
        email: ''
      });
      setFormOpen(false);
      setSubmitStatus({ loading: false, error: null });
      
      // Fetch updated riders
      await fetchRiders();
    } catch (err) {
      console.error('Failed to create rider:', err);
      setSubmitStatus({
        loading: false,
        error: err.message || 'Failed to create rider. Please try again.'
      });
    }
  };

  // Delete rider
  const handleDelete = async (riderId) => {
    if (window.confirm('Are you sure you want to delete this rider?')) {
      try {
        await ridersApi.delete(riderId);
        // Update local state
        setRiders(riders.filter(rider => rider.id !== riderId));
      } catch (err) {
        console.error('Failed to delete rider:', err);
        setError('Failed to delete rider. Please try again.');
      }
    }
  };

  // View rider's assigned orders
  const handleViewOrders = async (rider) => {
    setSelectedRider(rider);
    setOrdersLoading(true);
    setOrderModalOpen(true);
    
    try {
      const orders = await ridersApi.getAssignedOrders(rider.id);
      setSelectedRiderOrders(orders);
    } catch (err) {
      console.error('Failed to fetch rider orders:', err);
      setSelectedRiderOrders([]);
      setError('Failed to load assigned orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Close order modal
  const closeOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedRider(null);
    setSelectedRiderOrders([]);
  };

  if (loading && riders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rider Management</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={() => setFormOpen(!formOpen)}
        >
          {formOpen ? 'Cancel' : 'Add New Rider'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {formOpen && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Rider</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            {submitStatus.error && (
              <div className="mt-4 text-red-500 text-sm">
                {submitStatus.error}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                disabled={submitStatus.loading}
              >
                {submitStatus.loading ? 'Saving...' : 'Save Rider'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {riders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No riders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riders.map(rider => (
                <tr key={rider.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{rider.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rider.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rider.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rider.assigned_orders_count || 0}
                      {rider.assigned_orders_count > 0 && (
                        <button
                          onClick={() => handleViewOrders(rider)}
                          className="ml-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className={`text-red-600 hover:text-red-900 ${rider.assigned_orders_count > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => rider.assigned_orders_count === 0 && handleDelete(rider.id)}
                      disabled={rider.assigned_orders_count > 0}
                      title={rider.assigned_orders_count > 0 ? "Cannot delete rider with assigned orders" : "Delete rider"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Order Details Modal */}
      {orderModalOpen && selectedRider && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-700/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Orders Assigned to {selectedRider.name}
                </h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {ordersLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : selectedRiderOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders found for this rider.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedRiderOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">Customer: {order.user_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{order.total}</p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>  
                      </div>
                      
                      <div className="mt-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Paid' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'Undelivered' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.status}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          Assigned: {new Date(order.assigned_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                          <div className="border-t border-gray-200">
                            {order.items.map((item, index) => (
                              <div key={index} className="py-2 border-b border-gray-100 text-sm">
                                <div className="flex justify-between">
                                  <span>Product ID: {item.product_id}</span>
                                  <span>Quantity: {item.quantity}</span>
                                </div>
                                {item.variant_id && (
                                  <div className="text-gray-600 mt-1">
                                    Variant ID: {item.variant_id}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeOrderModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 