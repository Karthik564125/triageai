const { db } = require('../config/firebase');

exports.getTeamsAndMembers = async (req, res) => {
  try {
    // Get teams collection
    const teamsSnapshot = await db.collection('teams').get();
    const teamsList = [];
    teamsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name) teamsList.push(data.name);
    });

    // Get team members from users collection (role == 'team_member')
    const usersSnapshot = await db.collection('users').where('role', '==', 'team_member').get();
    const membersMap = {};

    usersSnapshot.forEach((doc) => {
      const u = doc.data();
      if (u.team) {
        if (!membersMap[u.team]) membersMap[u.team] = [];
        membersMap[u.team].push({
          id: doc.id,
          name: u.name,
          email: u.email,
          role: u.role
        });
      }
    });

    return res.json({
      success: true,
      teams: teamsList.length > 0 ? teamsList : [
        'Platform Engineering',
        'Application Engineering',
        'Security',
        'DevOps',
        'Database Team',
        'Billing Team',
        'Customer Support',
        'Product Team'
      ],
      members: membersMap
    });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teams data'
    });
  }
};
