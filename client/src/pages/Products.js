
import React, { useState } from "react";
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  X,
  Layers,
  Puzzle,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import "./Products.css";

const emptyForm = {
  name: "",
  type: "Physical",
  salesPrice: "",
  costPrice: "",
  notes: "",
  variants: "",
  addons: "",
};

const initialProducts = [
  {
    id: 1,
    name: "Premium Laptop",
    type: "Physical",
    salesPrice: "65000",
    costPrice: "52000",
    notes: "High performance laptop",
    variants: "8GB RAM, 16GB RAM, 32GB RAM",
    addons: "Extended Warranty, Laptop Bag, Wireless Mouse",
  },
  {
    id: 2,
    name: "Cloud Storage",
    type: "Digital",
    salesPrice: "999",
    costPrice: "400",
    notes: "1TB cloud storage plan",
    variants: "100GB, 500GB, 1TB",
    addons: "Priority Support, Data Backup",
  },
];

function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openAddModal = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      type: product.type,
      salesPrice: product.salesPrice,
      costPrice: product.costPrice,
      notes: product.notes,
      variants: product.variants || "",
      addons: product.addons || "",
    });

    setEditingId(product.id);
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (formData.salesPrice === "" || Number(formData.salesPrice) < 0) {
      newErrors.salesPrice = "Enter a valid sales price";
    }

    if (formData.costPrice === "" || Number(formData.costPrice) < 0) {
      newErrors.costPrice = "Enter a valid cost price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingId !== null) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId
            ? { ...product, ...formData }
            : product
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...formData,
        },
      ]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (confirmed) {
      setProducts((prev) =>
        prev.filter((product) => product.id !== id)
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header products-header">
        <div>
          <h1>Products</h1>
          <p>Manage products, variants, add-ons and pricing.</p>
        </div>

        <button className="add-product-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="products-toolbar">
        <div className="product-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span>{filteredProducts.length} Products</span>
      </div>

      {/* Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Sales Price</th>
              <th>Cost Price</th>
              <th>Variants</th>
              <th>Add-ons</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-icon">
                        <Package size={18} />
                      </div>
                      <strong>{product.name}</strong>
                    </div>
                  </td>

                  <td>
                    <span className="product-type">{product.type}</span>
                  </td>

                  <td>
                    ₹{Number(product.salesPrice).toLocaleString("en-IN")}
                  </td>

                  <td>
                    ₹{Number(product.costPrice).toLocaleString("en-IN")}
                  </td>

                  <td>
                    <span className="product-count">
                      {product.variants
                        ? product.variants.split(",").filter(Boolean).length
                        : 0}
                    </span>
                  </td>

                  <td>
                    <span className="product-count addon-count">
                      {product.addons
                        ? product.addons.split(",").filter(Boolean).length
                        : 0}
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        title="Edit Product"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        title="Delete Product"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <EmptyState
                    title="No products found"
                    description="Try another search or add a new product."
                    actionLabel="Add Product"
                    onAction={openAddModal}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="product-modal-overlay">
          <div className="product-modal">
            <div className="product-modal-header">
              <div>
                <h2>
                  {editingId !== null ? "Edit Product" : "Add New Product"}
                </h2>
                <p>Enter product information and optional configurations.</p>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="product-form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <small className="product-error">{errors.name}</small>
                )}
              </div>

              <div className="product-form-group">
                <label>Product Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Physical">Physical</option>
                  <option value="Digital">Digital</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              <div className="product-form-row">
                <div className="product-form-group">
                  <label>Sales Price (₹) *</label>
                  <input
                    type="number"
                    name="salesPrice"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.salesPrice}
                    onChange={handleChange}
                  />
                  {errors.salesPrice && (
                    <small className="product-error">{errors.salesPrice}</small>
                  )}
                </div>

                <div className="product-form-group">
                  <label>Cost Price (₹) *</label>
                  <input
                    type="number"
                    name="costPrice"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={handleChange}
                  />
                  {errors.costPrice && (
                    <small className="product-error">{errors.costPrice}</small>
                  )}
                </div>
              </div>

              <div className="product-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  placeholder="Additional product information..."
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              {/* Variants */}
              <div className="product-section-heading">
                <Layers size={18} />
                <span>Product Variants</span>
              </div>

              <div className="product-form-group">
                <label>Variants</label>
                <textarea
                  name="variants"
                  placeholder="Example: 8GB RAM, 16GB RAM, 32GB RAM"
                  value={formData.variants}
                  onChange={handleChange}
                  rows="2"
                />
                <small>Separate each variant using a comma.</small>
              </div>

              {/* Add-ons */}
              <div className="product-section-heading">
                <Puzzle size={18} />
                <span>Product Add-ons</span>
              </div>

              <div className="product-form-group">
                <label>Add-ons</label>
                <textarea
                  name="addons"
                  placeholder="Example: Extended Warranty, Laptop Bag"
                  value={formData.addons}
                  onChange={handleChange}
                  rows="2"
                />
                <small>Separate each add-on using a comma.</small>
              </div>

              <div className="product-modal-actions">
                <button
                  type="button"
                  className="cancel-product-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-product-btn">
                  {editingId !== null ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
