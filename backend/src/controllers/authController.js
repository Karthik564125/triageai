const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Query Firestore users collection by username
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', normalizedUsername).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    let userData = null;
    let userId = null;

    snapshot.forEach((doc) => {
      userData = doc.data();
      userId = doc.id;
    });

    if (!userData || !userData.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Compare supplied password with stored bcrypt passwordHash
    const isMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Return safe user object (NO password or passwordHash returned!)
    return res.json({
      success: true,
      user: {
        id: userId,
        username: userData.username,
        name: userData.name,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Auth Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed due to a server error'
    });
  }
};
