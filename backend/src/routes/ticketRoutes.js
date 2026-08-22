const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Routes
router.post('/', ticketController.createTicket);
router.get('/my', ticketController.getMyTickets);
router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.put('/:id/assign', ticketController.assignTicket);
router.put('/:id/status', ticketController.updateTicketStatus);
router.post('/:id/comments', ticketController.addComment);
router.post('/:id/analyze', ticketController.analyzeTicket);
router.post('/:id/accept-ai', ticketController.acceptAISuggestions);
router.post('/:id/reject-ai', ticketController.rejectAISuggestions);


module.exports = router;
