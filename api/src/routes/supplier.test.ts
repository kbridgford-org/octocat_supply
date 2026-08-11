import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import supplierRouter from './supplier';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Supplier API', () => {
  beforeEach(async () => {
    // Ensure a fresh in-memory database for each test
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/suppliers', supplierRouter);
    // Attach error handler to translate repo errors
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  const validSupplier = {
    name: 'Acme Pet Supplies',
    description: 'A supplier of pet products',
    contactPerson: 'Jane Doe',
    email: 'jane@acme.com',
    phone: '555-0100',
    active: true,
    verified: false,
  };

  describe('CRUD operations', () => {
    it('should create a new supplier', async () => {
      const response = await request(app).post('/suppliers').send(validSupplier);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(validSupplier);
      expect(response.body.supplierId).toBeDefined();
    });

    it('should get all suppliers', async () => {
      await request(app).post('/suppliers').send(validSupplier);

      const response = await request(app).get('/suppliers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return an empty array when no suppliers exist', async () => {
      const response = await request(app).get('/suppliers');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should get a supplier by ID', async () => {
      const createResponse = await request(app).post('/suppliers').send(validSupplier);
      const supplierId = createResponse.body.supplierId;

      const response = await request(app).get(`/suppliers/${supplierId}`);

      expect(response.status).toBe(200);
      expect(response.body.supplierId).toBe(supplierId);
      expect(response.body.name).toBe('Acme Pet Supplies');
    });

    it('should return 404 for a non-existing supplier by ID', async () => {
      const response = await request(app).get('/suppliers/999');
      expect(response.status).toBe(404);
    });

    it('should update a supplier by ID', async () => {
      const createResponse = await request(app).post('/suppliers').send(validSupplier);
      const supplierId = createResponse.body.supplierId;

      const response = await request(app)
        .put(`/suppliers/${supplierId}`)
        .send({ name: 'Updated Supplies Co', contactPerson: 'John Smith' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Supplies Co');
      expect(response.body.contactPerson).toBe('John Smith');
    });

    it('should return 404 when updating a non-existing supplier', async () => {
      const response = await request(app)
        .put('/suppliers/999')
        .send({ name: 'Ghost Supplier' });
      expect(response.status).toBe(404);
    });

    it('should delete a supplier by ID', async () => {
      const createResponse = await request(app).post('/suppliers').send(validSupplier);
      const supplierId = createResponse.body.supplierId;

      const response = await request(app).delete(`/suppliers/${supplierId}`);
      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/suppliers/${supplierId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting a non-existing supplier', async () => {
      const response = await request(app).delete('/suppliers/999');
      expect(response.status).toBe(404);
    });

    it('should return a 500 error when required NOT NULL fields are missing', async () => {
      // NOTE: same root cause documented in product.test.ts — better-sqlite3 throws
      // specific constraint codes (e.g. 'SQLITE_CONSTRAINT_NOTNULL') that
      // handleDatabaseError()'s generic 'SQLITE_CONSTRAINT' check never matches, so
      // this falls through to a generic 500 DatabaseError instead of a 400
      // ValidationError. Pre-existing bug in utils/errors.ts, out of scope to fix
      // here; this test documents the current (buggy) behavior.
      const response = await request(app).post('/suppliers').send({ description: 'No name' });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /suppliers/:id/status', () => {
    // NOTE: processSupplierStatus() in supplier.ts has a misleading-indentation bug
    // (flagged in the source with `// Misleading indentation example`) — the
    // `return 'APPROVED'` statement is not actually scoped inside the
    // `if (supplier.active)` block, so it executes unconditionally and this endpoint
    // always returns 'APPROVED' regardless of the supplier's active/verified state.
    // These tests document that actual (buggy) current behavior; they are not
    // asserting this is the intended/desired behavior.

    it('should return 404 for a non-existing supplier', async () => {
      const response = await request(app).get('/suppliers/999/status');
      expect(response.status).toBe(404);
    });

    it('should always return APPROVED when active is true', async () => {
      const createResponse = await request(app)
        .post('/suppliers')
        .send({ ...validSupplier, active: true, verified: false });
      const supplierId = createResponse.body.supplierId;

      const response = await request(app).get(`/suppliers/${supplierId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });

    it('should always return APPROVED when active is false but verified is true', async () => {
      const createResponse = await request(app)
        .post('/suppliers')
        .send({ ...validSupplier, active: false, verified: true });
      const supplierId = createResponse.body.supplierId;

      const response = await request(app).get(`/suppliers/${supplierId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });

    it('should always return APPROVED when both active and verified are false', async () => {
      const createResponse = await request(app)
        .post('/suppliers')
        .send({ ...validSupplier, active: false, verified: false });
      const supplierId = createResponse.body.supplierId;

      const response = await request(app).get(`/suppliers/${supplierId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });
  });
});
