/**
 * Repository for products data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { Product, BulkLoadResult, BulkLoadResultDetail, BulkDeleteResult, BulkDeleteResultDetail } from '../models/product';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import {
  buildInsertSQL,
  buildUpdateSQL,
  objectToCamelCase,
  mapDatabaseRows,
  generatePlaceholders,
  DatabaseRow,
} from '../utils/sql';

export class ProductsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all products
   */
  async findAll(): Promise<Product[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM products ORDER BY product_id');
      return mapDatabaseRows<Product>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get product by ID
   */
  async findById(id: number): Promise<Product | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM products WHERE product_id = ?', [id]);
      return row ? objectToCamelCase<Product>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Create a new product
   */
  async create(product: Omit<Product, 'productId'>): Promise<Product> {
    try {
      const { sql, values } = buildInsertSQL('products', product);
      const result = await this.db.run(sql, values);

      const createdProduct = await this.findById(result.lastID || 0);
      if (!createdProduct) {
        throw new Error('Failed to retrieve created product');
      }

      return createdProduct;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update product by ID
   */
  async update(id: number, product: Partial<Omit<Product, 'productId'>>): Promise<Product> {
    try {
      const { sql, values } = buildUpdateSQL('products', product, 'product_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError('Product', id);
      }

      const updatedProduct = await this.findById(id);
      if (!updatedProduct) {
        throw new Error('Failed to retrieve updated product');
      }

      return updatedProduct;
    } catch (error) {
      handleDatabaseError(error, 'Product', id);
    }
  }

  /**
   * Delete product by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM products WHERE product_id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('Product', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'Product', id);
    }
  }

  /**
   * Check if product exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM products WHERE product_id = ?',
        [id],
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find products by supplier ID
   */
  async findBySupplierId(supplierId: number): Promise<Product[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM products WHERE supplier_id = ? ORDER BY name',
        [supplierId],
      );
      return mapDatabaseRows<Product>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find products by name (partial match)
   */
  async findByName(name: string): Promise<Product[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        `SELECT * FROM products WHERE name LIKE '%${name}%' ORDER BY name`,
      );
      return mapDatabaseRows<Product>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Bulk create products from a list of raw names.
   * Trims/drops blank entries, de-duplicates (case-insensitive) both against
   * existing products and within the submitted batch, then inserts survivors
   * using parameterized queries with sensible defaults for required fields
   * that aren't provided by a bulk-load name-only workflow.
   */
  async bulkCreateByNames(rawNames: string[]): Promise<BulkLoadResult> {
    const details: BulkLoadResultDetail[] = [];
    let added = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Normalize: trim and drop blank/whitespace-only entries
      const trimmedNames = rawNames.map((n) => (typeof n === 'string' ? n.trim() : ''));

      // Load existing product names for duplicate detection (parameterized)
      const existingRows = await this.db.all<{ name: string }>('SELECT name FROM products');
      const existingNamesLower = new Set(existingRows.map((row) => row.name.toLowerCase()));
      const seenInBatchLower = new Set<string>();

      for (const name of trimmedNames) {
        if (name === '') {
          // Silently drop blank/whitespace-only entries (not counted as skipped/error)
          continue;
        }

        const lowerName = name.toLowerCase();
        if (existingNamesLower.has(lowerName) || seenInBatchLower.has(lowerName)) {
          skipped++;
          details.push({ name, status: 'skipped', reason: 'Duplicate product name' });
          continue;
        }

        try {
          const sku = this.generateBulkSku(name);
          const { sql, values } = buildInsertSQL('products', {
            supplierId: 1,
            name,
            description: '',
            price: 0,
            sku,
            unit: 'piece',
            imgName: '',
            discount: 0,
          });
          await this.db.run(sql, values);

          seenInBatchLower.add(lowerName);
          existingNamesLower.add(lowerName);
          added++;
          details.push({ name, status: 'added' });
        } catch (error) {
          errors++;
          const message = error instanceof Error ? error.message : 'Unknown error';
          details.push({ name, status: 'error', reason: message });
        }
      }

      return { added, skipped, errors, details };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Count order_details rows that reference any of the given product IDs.
   * Used to warn admins that deleting these products will cascade-delete
   * their associated order history (order_details -> order_detail_deliveries).
   */
  async countOrderReferences(ids: number[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    try {
      const placeholders = generatePlaceholders(ids.length);
      const result = await this.db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM order_details WHERE product_id IN (${placeholders})`,
        ids,
      );
      return result?.count || 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Bulk delete products by ID. Deletes one at a time (rather than a single
   * IN (...) statement) so each ID's outcome can be reported individually,
   * mirroring the bulkCreateByNames summary shape. Not wrapped in a
   * transaction: partial success is intentional so callers see exactly which
   * IDs succeeded, were missing, or errored.
   *
   * Note: products.product_id is referenced by order_details with
   * ON DELETE CASCADE (which itself cascades to order_detail_deliveries), so
   * deleting a product also deletes any order history that references it.
   */
  async bulkDeleteByIds(rawIds: number[]): Promise<BulkDeleteResult> {
    const details: BulkDeleteResultDetail[] = [];
    let deleted = 0;
    let notFound = 0;
    let errors = 0;

    // De-duplicate while preserving first-seen order
    const ids = Array.from(new Set(rawIds));

    try {
      for (const id of ids) {
        try {
          const existing = await this.findById(id);
          const result = await this.db.run('DELETE FROM products WHERE product_id = ?', [id]);

          if (result.changes === 0) {
            notFound++;
            details.push({ productId: id, status: 'notFound', reason: 'Product not found' });
            continue;
          }

          deleted++;
          details.push({ productId: id, name: existing?.name, status: 'deleted' });
        } catch (error) {
          errors++;
          const message = error instanceof Error ? error.message : 'Unknown error';
          details.push({ productId: id, status: 'error', reason: message });
        }
      }

      return { deleted, notFound, errors, details };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Generate a unique-ish SKU for a bulk-loaded product from its name.
   */
  private generateBulkSku(name: string): string {
    const slug = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BULK-${slug || 'ITEM'}-${suffix}`;
  }
}

// Factory function to create repository instance
export async function createProductsRepository(
  isTest: boolean = false,
): Promise<ProductsRepository> {
  const db = await getDatabase(isTest);
  return new ProductsRepository(db);
}

// Singleton instance for default usage
let productsRepo: ProductsRepository | null = null;

export async function getProductsRepository(isTest: boolean = false): Promise<ProductsRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    // In tests, always return a fresh repository bound to the current in-memory DB
    return createProductsRepository(true);
  }
  if (!productsRepo) {
    productsRepo = await createProductsRepository(false);
  }
  return productsRepo;
}
