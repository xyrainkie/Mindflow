import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/accountingController.js';

const router = Router();

router.use(authenticateToken);

router.get('/transactions', listTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;
