const { db } = require('../config/firebase');
const aiService = require('../services/aiService');
const { normalizeCategory } = require('../utils/categoryNormalizer');

const VALID_STATUSES = [
  'Open',
  'Assigned',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed'
];


// Generate short readable Ticket ID like TCK-1001
const generateTicketId = async () => {
  try {
    const snapshot = await db.collection('tickets').get();
    const count = snapshot.size;
    return `TCK-${1001 + count}`;
  } catch (error) {
    return `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};

// Create a Ticket (POST /api/tickets)
exports.createTicket = async (req, res) => {
  try {
    const { customerName, customerEmail, subject, description, product, attachment, userId } = req.body;

    if (!customerName || !customerEmail || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email, subject, and description are required'
      });
    }

    const ticketId = await generateTicketId();
    const now = new Date().toISOString();

    const newTicket = {
      ticketId,
      userId: userId || null,
      customerName,
      customerEmail,
      subject,
      description,
      product: product || 'General',
      attachment: attachment || null,
      priority: 'Medium',
      category: 'Other',
      status: 'Open',
      assignedTeam: null,
      assignedMember: null,
      assignedUser: null,
      ai: {
        summary: null,
        category: null,
        priority: null,
        priorityReason: null,
        recommendedTeam: null,
        suggestedResponse: null
      },
      aiSuggestions: null,
      aiAnalysisStatus: 'pending',
      timeline: [
        {
          id: `tl_${Date.now()}_1`,
          type: 'created',
          title: 'Ticket Created',
          description: `Submitted by ${customerName}`,
          user: customerName,
          timestamp: now
        }
      ],
      comments: [],
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('tickets').add(newTicket);

    return res.status(201).json({
      success: true,
      ticket: {
        id: docRef.id,
        ...newTicket
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ticket'
    });
  }
};

// GET My Tickets for Client (GET /api/tickets/my)
exports.getMyTickets = async (req, res) => {
  try {
    const { email, userId } = req.query;

    const ticketsRef = db.collection('tickets');
    let snapshot;

    if (userId) {
      snapshot = await ticketsRef.where('userId', '==', userId).get();
    } else if (email) {
      snapshot = await ticketsRef.where('customerEmail', '==', email).get();
    } else {
      snapshot = await ticketsRef.get();
    }

    const tickets = [];
    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort descending by createdAt
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
};

// GET All Tickets for Admin (GET /api/tickets)
exports.getAllTickets = async (req, res) => {
  try {
    const snapshot = await db.collection('tickets').get();
    const tickets = [];

    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort descending by createdAt
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
};

// GET Single Ticket by ID (GET /api/tickets/:id)
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding by doc.id first
    let doc = await db.collection('tickets').doc(id).get();

    if (!doc.exists) {
      // Search by ticketId string field
      const snapshot = await db.collection('tickets').where('ticketId', '==', id).get();
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }
      snapshot.forEach((d) => {
        doc = d;
      });
    }

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
};

// PUT Admin Assign Ticket (PUT /api/tickets/:id/assign)
exports.assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTeam, assignedMember, assignedUser, adminName } = req.body;

    const docRef = db.collection('tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticketData = doc.data();
    const now = new Date().toISOString();
    const targetMember = assignedMember || assignedUser || null;
    const newStatus = ticketData.status === 'Open' ? 'Assigned' : ticketData.status;

    const previousTeam = ticketData.assignedTeam || null;
    const assignmentChanged = previousTeam !== assignedTeam
      || (ticketData.assignedMember || ticketData.assignedUser || null) !== targetMember;
    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: previousTeam ? 'team_reassigned' : 'team_assigned',
      title: previousTeam ? 'Team Reassigned' : 'Team Assigned',
      description: previousTeam
        ? `Reassigned from ${previousTeam} to ${assignedTeam}${targetMember ? ` (Member: ${targetMember})` : ''}`
        : `Assigned to ${assignedTeam}${targetMember ? ` (Member: ${targetMember})` : ''}`,
      team: assignedTeam,
      member: targetMember,
      user: adminName || 'Admin',
      timestamp: now
    };

    const updatedData = {
      assignedTeam,
      assignedMember: targetMember,
      assignedUser: targetMember,
      status: newStatus,
      updatedAt: now,
      timeline: assignmentChanged
        ? [...(ticketData.timeline || []), newTimelineEvent]
        : (ticketData.timeline || [])
    };

    await docRef.update(updatedData);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket'
    });
  }
};

// PUT Update Ticket Status (PUT /api/tickets/:id/status)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userName, actorType, action } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const docRef = db.collection('tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticketData = doc.data();
    if (actorType === 'customer' && ticketData.status !== 'Waiting for Customer') {
      return res.status(409).json({
        success: false,
        message: 'Customer confirmation is only available while waiting for customer response'
      });
    }
    if (ticketData.status === status) {
      return res.json({
        success: true,
        ticket: { id: doc.id, ...ticketData }
      });
    }
    const now = new Date().toISOString();

    const isCustomerAction = actorType === 'customer'
      && (action === 'resolved' || action === 'needs_help');
    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: isCustomerAction
        ? action === 'resolved' ? 'customer_confirmed_resolved' : 'customer_needs_help'
        : 'status',
      title: isCustomerAction
        ? action === 'resolved' ? 'Customer Confirmed Issue Resolved' : 'Customer Requested More Help'
        : 'Status Updated',
      description: isCustomerAction
        ? action === 'resolved'
          ? 'Customer confirmed that the issue is resolved.'
          : 'Customer indicated that more help is still needed.'
        : `Status changed from ${ticketData.status} to ${status}`,
      user: userName || 'Admin',
      actorType: isCustomerAction ? 'customer' : 'admin',
      timestamp: now
    };

    const updatedData = {
      status,
      updatedAt: now,
      timeline: [...(ticketData.timeline || []), newTimelineEvent]
    };

    await docRef.update(updatedData);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status'
    });
  }
};

// POST Add Internal Comment (POST /api/tickets/:id/comments)
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, author, avatar } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const docRef = db.collection('tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticketData = doc.data();
    const now = new Date().toISOString();

    const newComment = {
      id: `c_${Date.now()}`,
      author: author || 'Admin',
      avatar: avatar || null,
      text: text.trim(),
      timestamp: now
    };

    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: 'comment',
      title: 'Internal Note Added',
      description: `Internal comment added by ${author || 'Admin'}`,
      user: author || 'Admin',
      timestamp: now
    };

    const updatedData = {
      updatedAt: now,
      comments: [...(ticketData.comments || []), newComment],
      timeline: [...(ticketData.timeline || []), newTimelineEvent]
    };

    await docRef.update(updatedData);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// POST Analyze Ticket with Gemini AI (POST /api/tickets/:id/analyze)
exports.analyzeTicket = async (req, res) => {
  let docRef;
  let doc;
  let ticketData;

  try {
    const { id } = req.params;

    // 1. Fetch ticket from Firestore
    docRef = db.collection('tickets').doc(id);
    doc = await docRef.get();

    if (!doc.exists) {
      // Search by ticketId string field
      const snapshot = await db.collection('tickets').where('ticketId', '==', id).get();
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }
      snapshot.forEach((d) => {
        docRef = d.ref;
        doc = d;
      });
    }

    ticketData = doc.data();

    // 2. Fetch available support teams from Firestore teams collection
    const teamsSnapshot = await db.collection('teams').get();
    const availableTeams = [];
    teamsSnapshot.forEach((tDoc) => {
      const tData = tDoc.data();
      if (tData.name) {
        availableTeams.push(tData.name);
      }
    });

    // 3. Mark state as processing
    await docRef.update({
      'ai.status': 'processing',
      aiAnalysisStatus: 'processing',
      updatedAt: new Date().toISOString()
    });

    // 4. Run Gemini AI Service
    const aiOutput = await aiService.analyzeTicket(ticketData, availableTeams);

    // 5. Build completed AI suggestion structure
    const now = new Date().toISOString();
    const aiObject = {
      status: 'completed',
      summary: aiOutput.summary,
      category: normalizeCategory(aiOutput.category),
      priority: aiOutput.priority,
      priorityReason: aiOutput.priorityReason,
      recommendedTeam: aiOutput.recommendedTeam,
      suggestedResponse: aiOutput.suggestedResponse,
      generatedAt: now,
      error: null
    };

    const aiTimelineEvent = {
      id: `tl_${Date.now()}_ai`,
      type: 'ai_analyzed',
      title: 'AI Triage Completed',
      description: `Gemini AI recommended category "${aiOutput.category}" & priority "${aiOutput.priority}"`,
      user: 'Gemini AI Assistant',
      timestamp: now
    };

    const updatePayload = {
      ai: aiObject,
      aiSuggestions: {
        summary: aiOutput.summary,
        category: normalizeCategory(aiOutput.category),
        priority: aiOutput.priority,
        priorityReason: aiOutput.priorityReason,
        recommendedTeam: aiOutput.recommendedTeam,
        suggestedResponse: aiOutput.suggestedResponse
      },
      aiAnalysisStatus: 'completed',
      updatedAt: now,
      timeline: [...(ticketData.timeline || []), aiTimelineEvent]
    };

    // Update existing ticket document - NO DUPLICATION
    await docRef.update(updatePayload);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updatePayload
      }
    });
  } catch (error) {
    console.error('AI Analysis Controller Error:', error.message);

    const errorMessage = error.message || 'AI Triage service encountered an unexpected error';
    const now = new Date().toISOString();

    const failedAIObject = {
      status: 'failed',
      summary: '',
      category: '',
      priority: '',
      priorityReason: '',
      recommendedTeam: '',
      suggestedResponse: '',
      generatedAt: null,
      error: errorMessage
    };

    const updatePayload = {
      ai: failedAIObject,
      aiSuggestions: null,
      aiAnalysisStatus: 'failed',
      updatedAt: now
    };

    if (docRef) {
      try {
        await docRef.update(updatePayload);
      } catch (dbError) {
        console.error('Failed to update Firestore with AI failure state:', dbError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'AI Analysis failed',
      error: errorMessage,
      ticket: doc && doc.id ? { id: doc.id, ...ticketData, ...updatePayload } : null
    });
  }
};

// POST Accept AI Suggestions (POST /api/tickets/:id/accept-ai)
exports.acceptAISuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, category, priority, recommendedTeam, suggestedResponse, adminName } = req.body;

    let docRef = db.collection('tickets').doc(id);
    let doc = await docRef.get();

    if (!doc.exists) {
      const snapshot = await db.collection('tickets').where('ticketId', '==', id).get();
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }
      snapshot.forEach((d) => {
        docRef = d.ref;
        doc = d;
      });
    }

    const ticketData = doc.data();
    if (ticketData.aiAnalysisStatus === 'accepted' || ticketData.timeline?.some((event) => event.type === 'ai_accepted')) {
      return res.status(409).json({
        success: false,
        message: 'AI suggestions have already been accepted'
      });
    }
    const now = new Date().toISOString();
    const acceptedCategory = normalizeCategory(category || ticketData.category);
    const acceptedSuggestions = {
      ...(ticketData.aiSuggestions || {}),
      summary: summary || ticketData.aiSuggestions?.summary || ticketData.ai?.summary || '',
      category: acceptedCategory,
      priority: priority || ticketData.aiSuggestions?.priority || ticketData.priority,
      priorityReason: ticketData.aiSuggestions?.priorityReason || ticketData.ai?.priorityReason || '',
      recommendedTeam: recommendedTeam || ticketData.aiSuggestions?.recommendedTeam || '',
      suggestedResponse: suggestedResponse || ticketData.aiSuggestions?.suggestedResponse || ticketData.ai?.suggestedResponse || ''
    };

    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: 'ai_accepted',
      title: 'AI Triage Accepted',
      description: `Suggestions approved by ${adminName || 'Admin'} (Category: ${acceptedCategory}, Priority: ${acceptedSuggestions.priority})`,
      user: adminName || 'Admin',
      timestamp: now
    };

    const updateData = {
      category: acceptedCategory,
      priority: acceptedSuggestions.priority,
      aiSuggestions: acceptedSuggestions,
      aiAnalysisStatus: 'accepted',
      updatedAt: now,
      timeline: [...(ticketData.timeline || []), newTimelineEvent]
    };

    await docRef.update(updateData);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Accept AI suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept AI suggestions'
    });
  }
};

// POST Reject AI Suggestions (POST /api/tickets/:id/reject-ai)
exports.rejectAISuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;

    let docRef = db.collection('tickets').doc(id);
    let doc = await docRef.get();

    if (!doc.exists) {
      const snapshot = await db.collection('tickets').where('ticketId', '==', id).get();
      if (snapshot.empty) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }
      snapshot.forEach((d) => {
        docRef = d.ref;
        doc = d;
      });
    }

    const ticketData = doc.data();
    const now = new Date().toISOString();

    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      type: 'ai_rejected',
      title: 'AI Triage Rejected',
      description: `AI suggestions were rejected by ${adminName || 'Admin'}. Manual triage active.`,
      user: adminName || 'Admin',
      timestamp: now
    };

    const updateData = {
      aiAnalysisStatus: 'rejected',
      updatedAt: now,
      timeline: [...(ticketData.timeline || []), newTimelineEvent]
    };

    await docRef.update(updateData);

    return res.json({
      success: true,
      ticket: {
        id: doc.id,
        ...ticketData,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Reject AI suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject AI suggestions'
    });
  }
};

