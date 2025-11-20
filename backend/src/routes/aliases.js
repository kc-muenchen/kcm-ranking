import express from 'express';
import {
  getAllAliases,
  getAliasById,
  createAlias,
  updateAlias,
  deleteAlias,
  normalizeName
} from '../controllers/aliases.js';

const router = express.Router();

// GET /api/aliases - Get all aliases
router.get('/', getAllAliases);

// GET /api/aliases/normalize/:name - Normalize a player name
router.get('/normalize/:name', normalizeName);

// GET /api/aliases/:id - Get alias by ID
router.get('/:id', getAliasById);

// POST /api/aliases - Create new alias
router.post('/', createAlias);

// PUT /api/aliases/:id - Update alias
router.put('/:id', updateAlias);

// DELETE /api/aliases/:id - Delete alias
router.delete('/:id', deleteAlias);

export default router;

