import { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, InputNumber, Upload, message, Tabs, Popconfirm, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';

const { TabPane } = Tabs;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [form] = Form.useForm();
  const [variantForm] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (error) {
      message.error('Failed to fetch products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showProductModal = (product = null) => {
    setEditMode(!!product);
    setCurrentProduct(product);
    form.resetFields();

    if (product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price / 100, // Convert cents to dollars for display
        image: product.image
      });
    }

    setProductModalVisible(true);
  };

  const showVariantModal = (productId, variant = null) => {
    setEditMode(!!variant);
    setCurrentVariant(variant);
    setCurrentProductId(productId);
    variantForm.resetFields();

    if (variant) {
      variantForm.setFieldsValue({
        name: variant.name,
        color: variant.color,
        size: variant.size,
        price: variant.price / 100, // Convert cents to dollars for display
        stock: variant.stock
      });
    }

    setVariantModalVisible(true);
  };

  const handleProductSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Convert price from dollars to cents for storage
      const productData = {
        ...values,
        price: Math.round(values.price * 100) // Convert to cents and ensure it's an integer
      };

      if (editMode && currentProduct) {
        await adminApi.updateProduct(currentProduct.id, productData);
        message.success('Product updated successfully');
      } else {
        await adminApi.createProduct(productData);
        message.success('Product created successfully');
      }

      setProductModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('Error submitting product:', error);
      message.error('Failed to save product');
    }
  };

  const handleVariantSubmit = async () => {
    try {
      const values = await variantForm.validateFields();
      
      // Convert price from dollars to cents for storage
      const variantData = {
        ...values,
        price: Math.round(values.price * 100) // Convert to cents and ensure it's an integer
      };

      if (editMode && currentVariant) {
        await adminApi.updateVariant(currentProductId, currentVariant.id, variantData);
        message.success('Variant updated successfully');
      } else {
        await adminApi.createVariant(currentProductId, variantData);
        message.success('Variant created successfully');
      }

      setVariantModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error('Error submitting variant:', error);
      message.error('Failed to save variant');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await adminApi.deleteProduct(productId);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Failed to delete product');
    }
  };

  const handleDeleteVariant = async (productId, variantId) => {
    try {
      await adminApi.deleteVariant(productId, variantId);
      message.success('Variant deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting variant:', error);
      message.error('Failed to delete variant');
    }
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const variantsColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Color', dataIndex: 'color', key: 'color', 
      render: color => color && <Tag color={color.toLowerCase()}>{color}</Tag> 
    },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Price', dataIndex: 'price', key: 'price', 
      render: price => formatPrice(price) 
    },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, variant) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => showVariantModal(variant.product_id, variant)}
          />
          <Popconfirm
            title="Are you sure you want to delete this variant?"
            onConfirm={() => handleDeleteVariant(variant.product_id, variant.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderProductCard = (product) => {
    return (
      <Card
        key={product.id}
        title={product.name}
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => showProductModal(product)}
            />
            <Popconfirm
              title="Are you sure you want to delete this product?"
              onConfirm={() => handleDeleteProduct(product.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Space>
        }
      >
        <div style={{ display: 'flex' }}>
          <div style={{ marginRight: 16, flexShrink: 0 }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: 200, height: 200, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 200, height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No Image
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p><strong>Price:</strong> {formatPrice(product.price)}</p>
            <p><strong>Description:</strong> {product.description}</p>
            
            <Tabs defaultActiveKey="1">
              <TabPane tab="Variants" key="1">
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => showVariantModal(product.id)}
                  >
                    Add Variant
                  </Button>
                </div>
                
                <Table 
                  columns={variantsColumns} 
                  dataSource={product.variants.map(v => ({ ...v, key: v.id }))} 
                  size="small"
                  pagination={false}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Products Management</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => showProductModal()}
        >
          Add Product
        </Button>
      </div>

      {loading ? (
        <div>Loading products...</div>
      ) : (
        products.map(renderProductCard)
      )}

      {/* Product Modal */}
      <Modal
        title={editMode ? 'Edit Product' : 'Add New Product'}
        open={productModalVisible}
        onOk={handleProductSubmit}
        onCancel={() => setProductModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price ($)"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            name="image"
            label="Image URL"
          >
            <Input placeholder="Enter image URL" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Variant Modal */}
      <Modal
        title={editMode ? 'Edit Variant' : 'Add New Variant'}
        open={variantModalVisible}
        onOk={handleVariantSubmit}
        onCancel={() => setVariantModalVisible(false)}
      >
        <Form form={variantForm} layout="vertical">
          <Form.Item
            name="name"
            label="Variant Name"
            rules={[{ required: true, message: 'Please enter variant name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="Color"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="size"
            label="Size"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price ($)"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true, message: 'Please enter stock quantity' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products; 