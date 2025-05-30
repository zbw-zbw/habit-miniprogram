/**
 * 习惯挑战控制器
 */
const { validationResult } = require('express-validator');
const Challenge = require('../models/challenge.model');
const ChallengeParticipant = require('../models/challenge-participant.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * 获取挑战列表
 * @route GET /api/community/challenges
 */
exports.getChallenges = async (req, res) => {
  try {
    const {
      type = 'all',
      status = 'active',
      category,
      isOfficial,
      isFeatured,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    let query = {};
    
    // 挑战类型
    if (type !== 'all') {
      query.type = type;
    }
    
    // 挑战状态
    if (status !== 'all') {
      query.status = status;
    }
    
    // 挑战分类
    if (category) {
      query['targetHabit.category'] = category;
    }
    
    // 官方挑战
    if (isOfficial === 'true') {
      query.isOfficial = true;
    }
    
    // 精选挑战
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    
    // 搜索关键词
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }
    
    // 隐私设置 - 只显示公开挑战或当前用户创建的挑战
    query.$or = [
      { privacy: 'public' },
      { creator: req.user._id }
    ];
    
    // 获取挑战列表
    const challenges = await Challenge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('creator', 'username nickname avatar');
    
    // 查询用户是否已参与
    const challengeIds = challenges.map(c => c._id);
    const participations = await ChallengeParticipant.find({
      challenge: { $in: challengeIds },
      user: req.user._id
    });
    
    const participationMap = {};
    participations.forEach(p => {
      participationMap[p.challenge.toString()] = p;
    });
    
    // 添加参与状态
    const challengesWithStatus = challenges.map(challenge => {
      const participation = participationMap[challenge._id.toString()];
      const json = challenge.toJSON();
      
      return {
        ...json,
        isParticipating: !!participation,
        participationStatus: participation ? participation.status : null,
        progress: participation ? participation.progress : null
      };
    });
    
    // 获取总数
    const total = await Challenge.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        challenges: challengesWithStatus,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取挑战列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取挑战列表失败'
    });
  }
};

/**
 * 创建新挑战
 * @route POST /api/community/challenges
 */
exports.createChallenge = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      name,
      description,
      coverImage,
      type = 'personal',
      targetHabit,
      requirements,
      dateRange,
      rewards,
      privacy = 'public',
      maxParticipants = 0,
      tags
    } = req.body;
    
    // 验证日期范围
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: '结束日期必须晚于开始日期'
      });
    }
    
    // 创建新挑战
    const challenge = new Challenge({
      name,
      description,
      coverImage,
      creator: req.user._id,
      type,
      targetHabit,
      requirements,
      dateRange,
      rewards,
      privacy,
      maxParticipants,
      participantCount: 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    // 设置挑战状态
    const now = new Date();
    if (startDate <= now && endDate > now) {
      challenge.status = 'active';
    } else if (startDate > now) {
      challenge.status = 'upcoming';
    } else {
      challenge.status = 'completed';
    }
    
    await challenge.save();
    
    // 创建者自动参与挑战
    const participant = new ChallengeParticipant({
      challenge: challenge._id,
      user: req.user._id,
      status: 'joined',
      progress: {
        completedCount: 0,
        targetCount: requirements.targetCount
      }
    });
    
    await participant.save();
    
    // 更新挑战参与人数
    challenge.participantCount = 1;
    await challenge.save();
    
    // 填充创建者信息
    await challenge.populate('creator', 'username nickname avatar');
    
    res.status(201).json({
      success: true,
      message: '挑战创建成功',
      data: challenge
    });
  } catch (error) {
    console.error('创建挑战错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建挑战失败'
    });
  }
};

/**
 * 检查挑战所有者
 * 中间件，用于验证请求用户是否为挑战创建者
 */
exports.checkChallengeOwner = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 将挑战添加到请求对象中
    req.resource = challenge;
    
    next();
  } catch (error) {
    console.error('检查挑战所有者错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

/**
 * 获取指定挑战详情
 * @route GET /api/community/challenges/:challengeId
 */
exports.getChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    
    const challenge = await Challenge.findById(challengeId)
      .populate('creator', 'username nickname avatar');
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 检查权限
    if (challenge.privacy !== 'public' && challenge.creator._id.toString() !== req.user._id.toString()) {
      // 检查用户是否被邀请参与
      const isInvited = await ChallengeParticipant.findOne({
        challenge: challengeId,
        user: req.user._id,
        status: 'invited'
      });
      
      if (!isInvited) {
        return res.status(403).json({
          success: false,
          message: '无权查看此挑战'
        });
      }
    }
    
    // 查询用户参与状态
    const participation = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: req.user._id
    });
    
    const challengeData = challenge.toJSON();
    
    // 添加参与状态
    challengeData.isParticipating = !!participation;
    challengeData.participationStatus = participation ? participation.status : null;
    challengeData.progress = participation ? participation.progress : null;
    
    res.status(200).json({
      success: true,
      data: challengeData
    });
  } catch (error) {
    console.error('获取挑战详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取挑战详情失败'
    });
  }
};

/**
 * 更新指定挑战
 * @route PUT /api/community/challenges/:challengeId
 */
exports.updateChallenge = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      name,
      description,
      coverImage,
      privacy,
      maxParticipants,
      tags
    } = req.body;
    
    const challenge = req.resource;
    
    // 检查挑战状态，只能修改未开始的挑战
    if (challenge.status !== 'upcoming' && (
      name !== undefined ||
      description !== undefined ||
      privacy !== undefined
    )) {
      return res.status(400).json({
        success: false,
        message: '已开始的挑战不能修改基本信息'
      });
    }
    
    // 更新挑战内容
    if (name !== undefined) challenge.name = name;
    if (description !== undefined) challenge.description = description;
    if (coverImage !== undefined) challenge.coverImage = coverImage;
    if (privacy !== undefined) challenge.privacy = privacy;
    if (maxParticipants !== undefined) challenge.maxParticipants = maxParticipants;
    if (tags !== undefined) challenge.tags = tags.split(',').map(tag => tag.trim());
    
    await challenge.save();
    
    res.status(200).json({
      success: true,
      message: '挑战更新成功',
      data: challenge
    });
  } catch (error) {
    console.error('更新挑战错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新挑战失败'
    });
  }
};

/**
 * 删除指定挑战
 * @route DELETE /api/community/challenges/:challengeId
 */
exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = req.resource;
    
    // 检查挑战状态，只能删除未开始的挑战
    if (challenge.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: '已开始的挑战不能删除'
      });
    }
    
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      // 删除挑战参与记录
      await ChallengeParticipant.deleteMany({ challenge: challenge._id }, { session });
      
      // 删除挑战
      await Challenge.findByIdAndDelete(challenge._id, { session });
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '挑战删除成功'
    });
  } catch (error) {
    console.error('删除挑战错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除挑战失败'
    });
  }
};

/**
 * 参与挑战
 * @route POST /api/community/challenges/:challengeId/join
 */
exports.joinChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const userId = req.user._id;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 检查挑战状态
    if (challenge.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '已结束的挑战不能参与'
      });
    }
    
    if (challenge.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '已取消的挑战不能参与'
      });
    }
    
    // 检查是否已达到参与人数上限
    if (challenge.maxParticipants > 0 && challenge.participantCount >= challenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '挑战参与人数已达上限'
      });
    }
    
    // 检查用户是否已参与
    const existingParticipant = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: userId
    });
    
    if (existingParticipant && existingParticipant.status === 'joined') {
      return res.status(400).json({
        success: false,
        message: '已经参与此挑战'
      });
    }
    
    const session = await mongoose.startSession();
    let participant;
    
    await session.withTransaction(async () => {
      if (existingParticipant) {
        // 更新参与状态
        existingParticipant.status = 'joined';
        participant = await existingParticipant.save({ session });
      } else {
        // 创建新的参与记录
        participant = new ChallengeParticipant({
          challenge: challengeId,
          user: userId,
          status: 'joined',
          progress: {
            completedCount: 0,
            targetCount: challenge.requirements.targetCount
          }
        });
        
        await participant.save({ session });
        
        // 更新挑战参与人数
        challenge.participantCount += 1;
        await challenge.save({ session });
      }
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '成功参与挑战',
      data: participant
    });
  } catch (error) {
    console.error('参与挑战错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，参与挑战失败'
    });
  }
};

/**
 * 退出挑战
 * @route POST /api/community/challenges/:challengeId/leave
 */
exports.leaveChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const userId = req.user._id;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 检查是否为挑战创建者
    if (challenge.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: '挑战创建者不能退出挑战'
      });
    }
    
    // 检查用户是否已参与
    const participant = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: userId
    });
    
    if (!participant || participant.status !== 'joined') {
      return res.status(400).json({
        success: false,
        message: '未参与此挑战'
      });
    }
    
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      // 更新参与状态
      participant.status = 'withdrawn';
      await participant.save({ session });
      
      // 更新挑战参与人数
      challenge.participantCount = Math.max(0, challenge.participantCount - 1);
      await challenge.save({ session });
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '成功退出挑战'
    });
  } catch (error) {
    console.error('退出挑战错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，退出挑战失败'
    });
  }
};

/**
 * 获取挑战参与者列表
 * @route GET /api/community/challenges/:challengeId/participants
 */
exports.getChallengeParticipants = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const { status = 'joined', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 构建查询条件
    const query = {
      challenge: challengeId
    };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    // 获取参与者列表
    const participants = await ChallengeParticipant.find(query)
      .sort({ 'progress.completedCount': -1, joinedAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username nickname avatar');
    
    // 获取总数
    const total = await ChallengeParticipant.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        participants,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取挑战参与者列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取挑战参与者列表失败'
    });
  }
};

/**
 * 获取挑战排行榜
 * @route GET /api/community/challenges/:challengeId/leaderboard
 */
exports.getChallengeLeaderboard = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const { limit = 10 } = req.query;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 获取排行榜
    const leaderboard = await ChallengeParticipant.find({
      challenge: challengeId,
      status: { $in: ['joined', 'completed'] }
    })
    .sort({
      'progress.completionRate': -1,
      'progress.longestStreak': -1,
      'progress.completedCount': -1
    })
    .limit(parseInt(limit))
    .populate('user', 'username nickname avatar');
    
    // 为每个参与者添加排名
    const leaderboardWithRank = leaderboard.map((participant, index) => {
      const json = participant.toJSON();
      json.rank = index + 1;
      return json;
    });
    
    res.status(200).json({
      success: true,
      data: leaderboardWithRank
    });
  } catch (error) {
    console.error('获取挑战排行榜错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取挑战排行榜失败'
    });
  }
};

/**
 * 获取用户参与的挑战
 * @route GET /api/community/my-challenges
 */
exports.getUserChallenges = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const participantQuery = {
      user: req.user._id
    };
    
    if (status !== 'all') {
      participantQuery.status = status;
    }
    
    // 获取用户参与的挑战ID
    const participants = await ChallengeParticipant.find(participantQuery)
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const challengeIds = participants.map(p => p.challenge);
    
    // 获取挑战详情
    const challenges = await Challenge.find({
      _id: { $in: challengeIds }
    }).populate('creator', 'username nickname avatar');
    
    // 合并挑战和参与信息
    const participantMap = {};
    participants.forEach(p => {
      participantMap[p.challenge.toString()] = p;
    });
    
    const challengesWithProgress = challenges.map(challenge => {
      const participation = participantMap[challenge._id.toString()];
      const json = challenge.toJSON();
      
      return {
        ...json,
        participationStatus: participation ? participation.status : null,
        progress: participation ? participation.progress : null,
        joinedAt: participation ? participation.joinedAt : null
      };
    });
    
    // 按照参与时间排序
    challengesWithProgress.sort((a, b) => {
      return new Date(b.joinedAt) - new Date(a.joinedAt);
    });
    
    // 获取总数
    const total = await ChallengeParticipant.countDocuments(participantQuery);
    
    res.status(200).json({
      success: true,
      data: {
        challenges: challengesWithProgress,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户挑战列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户挑战列表失败'
    });
  }
}; 
