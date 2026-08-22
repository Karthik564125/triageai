import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamsData, setTeamsData] = useState({ teams: [], members: {} });

  const upsertTicket = useCallback((incomingTicket) => {
    if (!incomingTicket) return;

    setTickets((prev) => {
      const matchId = incomingTicket.id || incomingTicket.ticketId;
      const index = prev.findIndex((t) => (t.id && matchId && t.id === matchId) || (t.ticketId && matchId && t.ticketId === matchId));

      if (index === -1) {
        return [incomingTicket, ...prev];
      }

      const next = [...prev];
      next[index] = { ...prev[index], ...incomingTicket };
      return next;
    });
  }, []);

  // Fetch Tickets from Backend / Firestore
  const fetchTickets = useCallback(async (isAdmin = false, email = '', userId = '') => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        res = await api.getAllTickets();
      } else {
        res = await api.getMyTickets(email, userId);
      }
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (error) {
      console.error('Fetch tickets error:', error);
      toast.error('Failed to load tickets from server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Teams Taxonomy from Backend
  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.getTeams();
      if (res.success) {
        setTeamsData({
          teams: res.teams || [],
          members: res.members || {}
        });
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
    }
  }, []);

  // Create Ticket
  const createTicket = async (ticketData) => {
    try {
      const res = await api.createTicket(ticketData);
      if (res.success && res.ticket) {
        toast.success(`Ticket ${res.ticket.ticketId || res.ticket.id} created successfully!`);
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create ticket');
      throw error;
    }
  };

  // Admin Assign Ticket
  const assignTicket = async (ticketId, team, member, adminName = 'Admin') => {
    try {
      const res = await api.assignTicket(ticketId, {
        assignedTeam: team,
        assignedMember: member,
        adminName
      });
      if (res.success && res.ticket) {
        toast.success(`Assigned to ${team}${member ? ` (${member})` : ''}`);
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to assign ticket');
    }
  };

  // Update Status
  const updateTicketStatus = async (ticketId, status, userName = 'Admin', eventContext = {}) => {
    try {
      const res = await api.updateStatus(ticketId, { status, userName, ...eventContext });
      if (res.success && res.ticket) {
        toast.success(`Status updated to "${status}"`);
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Add Internal Comment
  const addInternalComment = async (ticketId, text, author = 'Admin', avatar = null) => {
    try {
      const res = await api.addComment(ticketId, { text, author, avatar });
      if (res.success && res.ticket) {
        toast.success('Internal comment added');
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const [analyzingTicketId, setAnalyzingTicketId] = useState(null);

  // Trigger Gemini AI Analysis for a Ticket
  const analyzeTicket = async (ticketId) => {
    setAnalyzingTicketId(ticketId);
    try {
      const res = await api.analyzeTicket(ticketId);
      if (res.ticket) {
        upsertTicket(res.ticket);
      }
      if (res.success) {
        toast.success('AI Triage completed successfully!');
      } else {
        toast.error(res.message || 'AI Analysis failed');
      }
      return res.ticket;
    } catch (error) {
      console.error('AI analysis context error:', error);
      toast.error(error.message || 'Failed to complete AI analysis');
      throw error;
    } finally {
      setAnalyzingTicketId(null);
    }
  };

  const retryAIAnalysis = async (ticketId) => {
    return await analyzeTicket(ticketId);
  };

  const acceptAISuggestions = async (ticketId, overrideData, adminName = 'Admin') => {
    try {
      const res = await api.acceptAISuggestions(ticketId, {
        ...overrideData,
        adminName
      });
      if (res.success && res.ticket) {
        toast.success('AI suggestions accepted and applied!');
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to accept AI suggestions');
    }
  };

  const rejectAISuggestions = async (ticketId, adminName = 'Admin') => {
    try {
      const res = await api.rejectAISuggestions(ticketId, { adminName });
      if (res.success && res.ticket) {
        toast.success('AI suggestions rejected. Manual triage active.');
        upsertTicket(res.ticket);
        return res.ticket;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reject AI suggestions');
    }
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        loading,
        teamsData,
        analyzingTicketId,
        fetchTickets,
        fetchTeams,
        createTicket,
        assignTicket,
        updateTicketStatus,
        addInternalComment,
        analyzeTicket,
        retryAIAnalysis,
        acceptAISuggestions,
        rejectAISuggestions
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);
