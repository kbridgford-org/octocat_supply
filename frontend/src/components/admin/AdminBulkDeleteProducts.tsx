import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { api } from '../../api/config';
import BulkDeleteConfirmModal from './BulkDeleteConfirmModal';

interface Product {
  productId: number;
  name: string;
  sku: string;
  price: number;
}

export interface BulkDeleteResultDetail {
  productId: number;
  name?: string;
  status: 'deleted' | 'notFound' | 'error';
  reason?: string;
}

export interface BulkDeleteResult {
  deleted: number;
  notFound: number;
  errors: number;
  details: BulkDeleteResultDetail[];
}

export default function AdminBulkDeleteProducts() {
  const { darkMode } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkDeleteResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [affectedOrderDetails, setAffectedOrderDetails] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Product[]>(`${api.baseURL}${api.endpoints.products}`);
      setProducts(response.data);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrorMessage('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleOne = (productId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(products.map((p) => p.productId)));
  };

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.has(p.productId)),
    [products, selectedIds],
  );

  const openConfirm = async () => {
    setErrorMessage(null);
    setResult(null);
    setAffectedOrderDetails(null);
    try {
      const response = await axios.post<{ affectedOrderDetails: number }>(
        `${api.baseURL}${api.endpoints.products}/bulk-delete/preview`,
        { ids: Array.from(selectedIds) },
      );
      setAffectedOrderDetails(response.data.affectedOrderDetails);
    } catch (error) {
      console.error('Error previewing bulk delete:', error);
      setAffectedOrderDetails(0);
    }
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post<BulkDeleteResult>(
        `${api.baseURL}${api.endpoints.products}/bulk-delete`,
        { ids: Array.from(selectedIds) },
      );
      setResult(response.data);
      setShowConfirm(false);
      await fetchProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      setErrorMessage('Failed to delete selected products. Please try again.');
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`container mx-auto px-4 pt-20 pb-8 max-w-4xl ${darkMode ? 'bg-dark' : 'bg-gray-100'} min-h-screen transition-colors duration-300`}
    >
      <div
        className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}
      >
        <h1
          className={`text-2xl font-bold mb-2 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
        >
          Bulk Delete Products
        </h1>
        <p
          className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}
        >
          Select products below and delete them in one step.
        </p>

        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div role="status" className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table
              className={`min-w-full ${darkMode ? 'bg-dark' : 'bg-white'} rounded-lg overflow-hidden transition-colors duration-300`}
            >
              <thead
                className={`${darkMode ? 'bg-gray-800' : 'bg-gray-200'} transition-colors duration-300`}
              >
                <tr>
                  <th className="px-6 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected;
                        }
                      }}
                      onChange={toggleAll}
                      aria-label="Select all products"
                      className="h-4 w-4 accent-primary"
                    />
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-light' : 'text-gray-700'} uppercase tracking-wider transition-colors duration-300`}
                  >
                    Name
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-light' : 'text-gray-700'} uppercase tracking-wider transition-colors duration-300`}
                  >
                    SKU
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-light' : 'text-gray-700'} uppercase tracking-wider transition-colors duration-300`}
                  >
                    Price
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} transition-colors duration-300`}
              >
                {products.map((product) => (
                  <tr
                    key={product.productId}
                    className={`hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors duration-300`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.productId)}
                        onChange={() => toggleOne(product.productId)}
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
                    >
                      {product.name}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
                    >
                      {product.sku}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
                    >
                      ${product.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center space-x-3 mt-6">
          <button
            onClick={openConfirm}
            disabled={selectedIds.size === 0 || isDeleting}
            className="px-6 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Selected ({selectedIds.size})
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h2
              className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}
            >
              Results
            </h2>
            <div
              role="status"
              className={`rounded-md px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 ${darkMode ? 'bg-dark' : 'bg-gray-50'} transition-colors duration-300`}
            >
              <span className="flex items-center text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                  {result.deleted} deleted
                </span>
              </span>
              <span className="flex items-center text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2" />
                <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                  {result.notFound} not found
                </span>
              </span>
              <span className="flex items-center text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />
                <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                  {result.errors} errors
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <BulkDeleteConfirmModal
          products={selectedProducts}
          affectedOrderDetails={affectedOrderDetails}
          isDeleting={isDeleting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
