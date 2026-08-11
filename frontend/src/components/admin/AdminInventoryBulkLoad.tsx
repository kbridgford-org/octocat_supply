import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/config';

interface BulkLoadResultDetail {
  name: string;
  status: 'added' | 'skipped' | 'error';
  reason?: string;
}

interface BulkLoadResult {
  added: number;
  skipped: number;
  errors: number;
  details: BulkLoadResultDetail[];
}

export default function AdminInventoryBulkLoad() {
  const { darkMode } = useTheme();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<BulkLoadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parseNames = (raw: string): string[] =>
    raw
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

  const handleBulkLoad = async () => {
    const names = parseNames(input);

    if (names.length === 0) {
      setErrorMessage('Please enter at least one product name.');
      setResult(null);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await axios.post<BulkLoadResult>(
        `${api.baseURL}${api.endpoints.products}/bulk`,
        { products: names },
      );
      setResult(response.data);
    } catch (error) {
      console.error('Error bulk loading products:', error);
      setErrorMessage('Failed to bulk load products. Please try again.');
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div
      className={`container mx-auto px-4 pt-20 pb-8 max-w-3xl ${darkMode ? 'bg-dark' : 'bg-gray-100'} min-h-screen transition-colors duration-300`}
    >
      <div
        className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}
      >
        <h1
          className={`text-2xl font-bold mb-2 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
        >
          Inventory Bulk Load
        </h1>
        <p
          className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}
        >
          Paste a comma-delimited list of products to add them to inventory in one step.
        </p>

        <label
          htmlFor="bulk-products-input"
          className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}
        >
          Products (comma-delimited)
        </label>
        <textarea
          id="bulk-products-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder="Smart Feeder Pro, Interactive Laser Toy, Cozy Heated Bed, GPS Collar, Auto Litter Box, Wellness Monitor"
          className={`w-full rounded-md border px-4 py-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300 ${
            darkMode
              ? 'bg-dark border-gray-700 text-light placeholder-gray-500'
              : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
          }`}
        />

        <div className="flex items-center space-x-3 mt-6">
          <button
            onClick={handleBulkLoad}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Loading…' : 'Bulk Load'}
          </button>
          <button
            onClick={handleClear}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md font-semibold border transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'border-gray-600 text-light hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Clear
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 px-4 py-3 rounded-md bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="mt-8">
          <h2
            className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}
          >
            Results
          </h2>
          <div
            className={`rounded-md px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 ${darkMode ? 'bg-dark' : 'bg-gray-50'} transition-colors duration-300`}
          >
            <span className="flex items-center text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
              <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                {result ? result.added : 0} added
              </span>
            </span>
            <span className="flex items-center text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2" />
              <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                {result ? result.skipped : 0} skipped (duplicate)
              </span>
            </span>
            <span className="flex items-center text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />
              <span className={darkMode ? 'text-light' : 'text-gray-800'}>
                {result ? result.errors : 0} errors
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
