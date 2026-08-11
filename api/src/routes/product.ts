/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API endpoints for managing products
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Returns all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 * /api/products/bulk:
 *   post:
 *     summary: Bulk create products from a comma-delimited/array list of names
 *     description: >
 *       Accepts a list of product names (e.g. from a pasted comma-delimited admin form),
 *       trims and drops blank entries, skips names that already exist or are duplicated
 *       within the batch (case-insensitive), and inserts the remaining products using
 *       sensible defaults for fields not supplied (supplierId, price, sku, unit, etc.).
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of product names to bulk create
 *     responses:
 *       200:
 *         description: Bulk load summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkLoadResult'
 *       400:
 *         description: Invalid or empty product list
 *
 * /api/products/bulk-delete/preview:
 *   post:
 *     summary: Preview the impact of a bulk delete
 *     description: >
 *       Returns the number of order_details rows that reference the given product IDs.
 *       Since order_details.product_id has ON DELETE CASCADE (which itself cascades to
 *       order_detail_deliveries), deleting these products will also delete that order
 *       history. Use this to warn admins before they confirm a bulk delete.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of product IDs to preview deletion for
 *     responses:
 *       200:
 *         description: Preview of affected order records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 affectedOrderDetails:
 *                   type: integer
 *                   description: Number of order_details rows that will cascade-delete
 *       400:
 *         description: Invalid or empty ID list
 *
 * /api/products/bulk-delete:
 *   post:
 *     summary: Bulk delete products by ID
 *     description: >
 *       Accepts a list of product IDs and deletes each one individually, reporting a
 *       per-item summary (deleted / not found / error) rather than failing the whole
 *       request if some IDs are invalid or missing. Deleting a product cascades to any
 *       order_details (and order_detail_deliveries) rows that reference it.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of product IDs to delete (max 100 per request)
 *     responses:
 *       200:
 *         description: Bulk delete summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkDeleteResult'
 *       400:
 *         description: Invalid, empty, or oversized ID list
 *
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */

import express from 'express';
import { Product } from '../models/product';
import { getProductsRepository } from '../repositories/productsRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();
const MAX_BULK_DELETE = 100;

function parseIdsFromBody(body: unknown): number[] | null {
  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return null;
  }
  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    return null;
  }
  return ids as number[];
}

// Create a new product
router.post('/', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    const newProduct = await repo.create(req.body as Omit<Product, 'productId'>);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
});

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    const products = await repo.findAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Bulk create products from a list of names
router.post('/bulk', async (req, res, next) => {
  try {
    const body = req.body as { products?: unknown };
    const rawProducts = body?.products;

    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include a non-empty "products" array of names',
        },
      });
      return;
    }

    if (!rawProducts.every((item) => typeof item === 'string')) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '"products" must be an array of strings',
        },
      });
      return;
    }

    const repo = await getProductsRepository();
    const result = await repo.bulkCreateByNames(rawProducts);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Preview the impact (cascading order_details) of a bulk delete
router.post('/bulk-delete/preview', async (req, res, next) => {
  try {
    const ids = parseIdsFromBody(req.body);
    if (!ids) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include a non-empty "ids" array of positive integers',
        },
      });
      return;
    }

    const repo = await getProductsRepository();
    const affectedOrderDetails = await repo.countOrderReferences(ids);
    res.status(200).json({ affectedOrderDetails });
  } catch (error) {
    next(error);
  }
});

// Bulk delete products by ID
router.post('/bulk-delete', async (req, res, next) => {
  try {
    const ids = parseIdsFromBody(req.body);
    if (!ids) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include a non-empty "ids" array of positive integers',
        },
      });
      return;
    }

    if (ids.length > MAX_BULK_DELETE) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `"ids" must contain at most ${MAX_BULK_DELETE} items`,
        },
      });
      return;
    }

    const repo = await getProductsRepository();
    const result = await repo.bulkDeleteByIds(ids);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Get a product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    const product = await repo.findById(parseInt(req.params.id));
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    next(error);
  }
});

// Get a product by name
router.get('/name/:name', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    const product = await repo.findByName(req.params.name);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    next(error);
  }
});

// Update a product by ID
router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    const updatedProduct = await repo.update(parseInt(req.params.id), req.body);
    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Product not found');
    } else {
      next(error);
    }
  }
});

// Delete a product by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getProductsRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Product not found');
    } else {
      next(error);
    }
  }
});

export default router;
