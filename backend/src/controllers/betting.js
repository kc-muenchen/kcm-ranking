import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Register new betting user
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters and password at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.bettingUser.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.bettingUser.create({
      data: {
        username,
        passwordHash,
        balance: 1000.0 // Starting balance
      }
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = await prisma.bettingUser.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await prisma.bettingUser.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.bettingUser.findUnique({
      where: { id: req.userId },
      include: {
        bets: {
          orderBy: { placedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      balance: user.balance,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
      recentBets: user.bets
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Place a bet
export const placeBet = async (req, res) => {
  try {
    const { tournamentId, tableName, amount, predictedWinner, odds, team1Names, team2Names } = req.body;

    if (!tournamentId || !tableName || !amount || !predictedWinner || !odds || !team1Names || !team2Names) {
      return res.status(400).json({ error: 'Missing required bet information' });
    }

    if (predictedWinner !== 1 && predictedWinner !== 2) {
      return res.status(400).json({ error: 'predictedWinner must be 1 or 2' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Bet amount must be positive' });
    }

    // Get user
    const user = await prisma.bettingUser.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create bet and update user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create bet
      const bet = await tx.bet.create({
        data: {
          userId: user.id,
          tournamentId,
          tableName,
          amount,
          predictedWinner,
          odds,
          team1Names: JSON.stringify(team1Names),
          team2Names: JSON.stringify(team2Names),
          status: 'pending'
        }
      });

      // Update user balance and total wagered
      const updatedUser = await tx.bettingUser.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
          totalWagered: { increment: amount }
        }
      });

      return { bet, updatedUser };
    });

    res.status(201).json({
      bet: result.bet,
      balance: result.updatedUser.balance
    });
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
};

// Get user's bets
export const getUserBets = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = { userId: req.userId };
    if (status) {
      where.status = status;
    }

    const bets = await prisma.bet.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Parse JSON strings
    const formattedBets = bets.map(bet => ({
      ...bet,
      team1Names: JSON.parse(bet.team1Names),
      team2Names: JSON.parse(bet.team2Names)
    }));

    res.json(formattedBets);
  } catch (error) {
    console.error('Get user bets error:', error);
    res.status(500).json({ error: 'Failed to get bets' });
  }
};

// Get all active bets (public)
export const getActiveBets = async (req, res) => {
  try {
    const bets = await prisma.bet.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: { placedAt: 'desc' },
      take: 100
    });

    // Parse JSON strings and hide user IDs
    const formattedBets = bets.map(bet => ({
      id: bet.id,
      username: bet.user.username,
      tableName: bet.tableName,
      amount: bet.amount,
      predictedWinner: bet.predictedWinner,
      odds: bet.odds,
      team1Names: JSON.parse(bet.team1Names),
      team2Names: JSON.parse(bet.team2Names),
      placedAt: bet.placedAt
    }));

    res.json(formattedBets);
  } catch (error) {
    console.error('Get active bets error:', error);
    res.status(500).json({ error: 'Failed to get active bets' });
  }
};

// Get leaderboard (public)
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const users = await prisma.bettingUser.findMany({
      select: {
        username: true,
        balance: true,
        totalWagered: true,
        totalWon: true
      },
      orderBy: { balance: 'desc' },
      take: parseInt(limit)
    });

    // Calculate ROI and other stats
    const leaderboard = users.map(user => ({
      username: user.username,
      balance: user.balance,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
      profit: user.balance - 1000, // Starting balance was 1000
      roi: user.totalWagered > 0 ? ((user.totalWon - user.totalWagered) / user.totalWagered * 100) : 0
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

