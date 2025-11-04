import { Router } from 'express';
import { getCase, listCases } from '../controllers/cases.js';

const router = Router();

router.get('/', listCases);
router.get('/:id', getCase);

export default router;
