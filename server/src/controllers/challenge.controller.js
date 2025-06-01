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
      page = 1, 
      limit = 10, 
      type = 'all', 
      status = 'active',
      keyword = '',
      tag = ''
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query = {};
    
    // 如果有关键词，添加标题或描述搜索
    if (keyword) {
      query.$or = [
        { name: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') }
      ];
    }
    
    // 如果有标签，添加标签搜索
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // 根据状态筛选
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // 根据类型筛选
    if (type === 'joined' && req.user) {
      // 查询用户参与的挑战ID
      const participations = await ChallengeParticipant.find({
        user: req.user._id,
        status: { $in: ['joined', 'completed'] }
      });
      
      const joinedChallengeIds = participations.map(p => p.challenge);
      
      query._id = { $in: joinedChallengeIds };
    } else if (type === 'popular') {
      // 热门挑战按参与人数排序
    } else if (type === 'new') {
      // 新挑战按创建时间排序
    }
    
    // 查询挑战总数
    const total = await Challenge.countDocuments(query);
    
    // 构建排序条件
    let sort = {};
    if (type === 'popular') {
      sort = { participantCount: -1 };
    } else if (type === 'new') {
      sort = { createdAt: -1 };
    } else {
      sort = { updatedAt: -1 };
    }
    
    // 查询挑战列表
    const challenges = await Challenge.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('creator', 'username nickname avatar')
      .lean();
    
    // 获取当前用户ID
    const userId = req.user ? req.user._id : null;
    
    // 处理挑战数据，添加参与状态和实际参与人数
    const processedChallenges = await Promise.all(challenges.map(async (challenge) => {
      // 查询用户是否已参与
      let isJoined = false;
      let userProgress = null;
      
      if (userId) {
        const participant = await ChallengeParticipant.findOne({
          challenge: challenge._id,
          user: userId,
          status: { $in: ['joined', 'completed'] }
        });
        
        isJoined = !!participant;
        
        if (participant) {
          userProgress = participant.progress;
        }
      }
      
      // 获取实际参与人数（排除创建者自己）
      const participantsCount = await ChallengeParticipant.countDocuments({
        challenge: challenge._id,
        status: { $in: ['joined', 'completed'] },
        user: { $ne: challenge.creator._id } // 排除创建者
      });
      
      return {
        ...challenge,
        isJoined,
        isParticipating: isJoined,
        progress: userProgress,
        participantsCount: participantsCount // 使用不包含创建者的参与人数
      };
    }));
    
    res.status(200).json({
      success: true,
      data: {
        challenges: processedChallenges,
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
    // 接收客户端数据
    const {
      title,
      description,
      rules,
      image,
      duration,
      startDate,
      tags,
      isPublic = true,
      habitId,
      needsApproval = false
    } = req.body;
    
    console.log('创建挑战请求数据:', req.body);
    
    // 数据验证
    if (!title || title.length < 5) {
      return res.status(400).json({
        success: false,
        message: '挑战标题不能为空且长度至少为5个字符'
      });
    }
    
    if (!description || description.length < 20) {
      return res.status(400).json({
        success: false,
        message: '挑战描述不能为空且长度至少为20个字符'
      });
    }
    
    if (!rules || rules.length < 20) {
      return res.status(400).json({
        success: false,
        message: '挑战规则不能为空且长度至少为20个字符'
      });
    }
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: '开始日期不能为空'
      });
    }
    
    // 计算结束日期
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration);
    
    // 创建新挑战
    const challenge = new Challenge({
      name: title,
      description,
      coverImage: image,
      creator: req.user._id,
      type: 'personal',
      targetHabit: {
        name: title,
        description: description
      },
      requirements: {
        targetCount: duration,
        requireStreak: false
      },
      dateRange: {
        startDate: start,
        endDate: end
      },
      rewards: {
        points: 100
      },
      privacy: isPublic ? 'public' : 'private',
      maxParticipants: 0,
      participantCount: 1,
      tags: tags || []
    });
    
    // 设置挑战状态
    const now = new Date();
    if (start <= now && end > now) {
      challenge.status = 'active';
    } else if (start > now) {
      challenge.status = 'upcoming';
    } else {
      challenge.status = 'completed';
    }
    
    await challenge.save();
    
    // 创建者自动参与挑战
    const ChallengeParticipant = mongoose.model('ChallengeParticipant');
    const participant = new ChallengeParticipant({
      challenge: challenge._id,
      user: req.user._id,
      status: 'joined',
      progress: {
        completedCount: 0,
        targetCount: duration
      },
      joinDate: new Date()
    });
    
    await participant.save();
    
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
 * @route GET /api/community/challenges/:id
 */
exports.getChallenge = async (req, res) => {
  try {
    const challengeId = req.params.id;
    
    // 查询挑战详情
    const challenge = await Challenge.findById(challengeId)
      .populate('creator', 'username nickname avatar')
      .lean();
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: '挑战不存在'
      });
    }
    
    // 获取当前用户ID
    const userId = req.user ? req.user._id : null;
    
    // 查询当前用户是否已参与
    let isJoined = false;
    let userProgress = null;
    
    if (userId) {
      const participant = await ChallengeParticipant.findOne({
        challenge: challengeId,
        user: userId,
        status: { $in: ['joined', 'completed'] }
      });
      
      isJoined = !!participant;
      
      if (participant) {
        userProgress = participant.progress;
      }
    }
    
    // 获取实际参与人数（排除创建者自己）
    const participantsCount = await ChallengeParticipant.countDocuments({
      challenge: challengeId,
      status: { $in: ['joined', 'completed'] },
      user: { $ne: challenge.creator._id } // 排除创建者
    });
    
    // 添加参与状态和进度
    const result = {
      ...challenge,
      isJoined,
      isParticipating: isJoined,
      progress: userProgress,
      participantsCount: participantsCount // 使用不包含创建者的参与人数
    };
    
    res.status(200).json({
      success: true,
      data: result
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
