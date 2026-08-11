import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ProductSummary {
  productId: number;
  name: string;
}

interface BulkDeleteConfirmModalProps {
  products: ProductSummary[];
  affectedOrderDetails: number | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BulkDeleteConfirmModal({
  products,
  affectedOrderDetails,
  isDeleting,
  onCancel,
  onConfirm,
}: BulkDeleteConfirmModalProps) {
  const { darkMode } = useTheme();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const hasCascadeImpact = !!affectedOrderDetails && affectedOrderDetails > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-confirm-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="bulk-delete-confirm-title"
          className={`text-xl font-bold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
        >
          Delete {products.length} product{products.length === 1 ? '' : 's'}?
        </h2>

        <ul
          className={`mb-4 max-h-48 overflow-y-auto list-disc list-inside text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {products.map((product) => (
            <li key={product.productId}>{product.name}</li>
          ))}
        </ul>

        {hasCascadeImpact && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-100 text-red-800 text-sm">
            <strong>Warning:</strong> {affectedOrderDetails} order record
            {affectedOrderDetails === 1 ? '' : 's'} reference{affectedOrderDetails === 1 ? 's' : ''}{' '}
            {products.length === 1 ? 'this product' : 'these products'}. Deleting{' '}
            {products.length === 1 ? 'it' : 'them'} will permanently delete that order history too.
          </div>
        )}

        {affectedOrderDetails === null && (
          <div className="mb-4 px-4 py-3 rounded-md bg-yellow-100 text-yellow-800 text-sm">
            Could not verify whether these products are referenced by existing orders. Deleting a
            product also deletes any order history linked to it.
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'border border-gray-600 text-light hover:bg-gray-700'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
