/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productId
 *         - name
 *         - price
 *       properties:
 *         productId:
 *           type: integer
 *           description: The unique identifier for the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The current price of the product
 *         supplierId:
 *           type: integer
 *           description: The ID of the supplier providing this product
 *         stockLevel:
 *           type: integer
 *           description: Current stock level of the product
 *         discount:
 *           type: number
 *           format: float
 *           description: Discount percentage (if applicable) expressed as a decimal (e.g., 0.25 for 25%)
 */
export interface Product {
  productId: number;
  supplierId: number;
  name: string;
  description: string;
  price: number;
  sku: string;
  unit: string;
  imgName: string;
  discount?: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     BulkLoadResultDetail:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [added, skipped, error]
 *         reason:
 *           type: string
 *     BulkLoadResult:
 *       type: object
 *       properties:
 *         added:
 *           type: integer
 *           description: Number of products successfully created
 *         skipped:
 *           type: integer
 *           description: Number of duplicate names skipped
 *         errors:
 *           type: integer
 *           description: Number of names that failed to insert
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkLoadResultDetail'
 */
export interface BulkLoadResultDetail {
  name: string;
  status: 'added' | 'skipped' | 'error';
  reason?: string;
}

export interface BulkLoadResult {
  added: number;
  skipped: number;
  errors: number;
  details: BulkLoadResultDetail[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     BulkDeleteResultDetail:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [deleted, notFound, error]
 *         reason:
 *           type: string
 *     BulkDeleteResult:
 *       type: object
 *       properties:
 *         deleted:
 *           type: integer
 *           description: Number of products successfully deleted
 *         notFound:
 *           type: integer
 *           description: Number of IDs that did not match an existing product
 *         errors:
 *           type: integer
 *           description: Number of IDs that failed to delete
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkDeleteResultDetail'
 */
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
