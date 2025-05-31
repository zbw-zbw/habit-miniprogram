/**
 * 小组数据种子脚本
 */
const mongoose = require('mongoose');
const Group = require('../models/group.model');
const User = require('../models/user.model');
require('dotenv').config({ path: '../../.env' });

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('数据库连接成功');
  seedGroups();
})
.catch((err) => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});

// 种子数据
const seedGroups = async () => {
  try {
    // 清空现有小组数据
    await Group.deleteMany({});
    console.log('已清空现有小组数据');

    // 获取第一个用户作为创建者
    const users = await User.find().limit(5);
    if (users.length === 0) {
      console.error('没有找到用户，请先添加用户数据');
      process.exit(1);
    }

    const creator = users[0];
    const members = users.map(user => user._id);

    // 创建示例小组数据
    const groups = [
      {
        name: '每日阅读打卡',
        description: '坚持每天阅读30分钟，分享阅读心得和好书推荐。一起在书海中遨游，提升自己的知识储备和思考能力。',
        type: 'habit',
        isPrivate: false,
        tags: ['阅读', '学习', '自我提升'],
        avatar: '/assets/images/group-reading.png',
        coverImage: '/assets/images/cover-reading.png',
        creator: creator._id,
        members: members,
        membersCount: members.length,
        postsCount: 12,
        createdAt: new Date('2025-04-01'),
        updatedAt: new Date()
      },
      {
        name: '健身达人',
        description: '分享健身经验、运动计划和健康饮食。无论你是健身新手还是老手，都可以在这里找到志同道合的伙伴，互相鼓励，共同进步。',
        type: 'habit',
        isPrivate: false,
        tags: ['健身', '运动', '健康'],
        avatar: '/assets/images/group-fitness.png',
        coverImage: '/assets/images/cover-fitness.png',
        creator: creator._id,
        members: members.slice(0, 3),
        membersCount: 3,
        postsCount: 8,
        createdAt: new Date('2025-04-15'),
        updatedAt: new Date()
      },
      {
        name: '早起俱乐部',
        description: '每天早起，享受清晨的宁静与美好。分享早起技巧、晨间习惯和高效工作方法。一起培养健康的作息习惯，提高生活质量。',
        type: 'habit',
        isPrivate: false,
        tags: ['早起', '时间管理', '生活'],
        avatar: '/assets/images/group-morning.png',
        coverImage: '/assets/images/cover-morning.png',
        creator: creator._id,
        members: members.slice(1, 4),
        membersCount: 3,
        postsCount: 5,
        createdAt: new Date('2025-05-01'),
        updatedAt: new Date()
      },
      {
        name: '编程学习小组',
        description: '分享编程学习资源、经验和项目。无论你是编程新手还是老手，都可以在这里找到志同道合的伙伴，一起学习成长。',
        type: 'habit',
        isPrivate: false,
        tags: ['编程', '学习', '技术'],
        avatar: '/assets/images/group-coding.png',
        coverImage: '/assets/images/cover-coding.png',
        creator: creator._id,
        members: [creator._id, members[2]],
        membersCount: 2,
        postsCount: 3,
        createdAt: new Date('2025-05-10'),
        updatedAt: new Date()
      },
      {
        name: '冥想与正念',
        description: '分享冥想技巧、正念练习和心灵成长。在繁忙的生活中找到内心的平静，提高专注力和幸福感。',
        type: 'habit',
        isPrivate: false,
        tags: ['冥想', '正念', '心理健康'],
        avatar: '/assets/images/group-meditation.png',
        coverImage: '/assets/images/cover-meditation.png',
        creator: creator._id,
        members: [creator._id],
        membersCount: 1,
        postsCount: 0,
        createdAt: new Date('2025-05-20'),
        updatedAt: new Date()
      }
    ];

    // 插入小组数据
    await Group.insertMany(groups);
    console.log(`成功添加 ${groups.length} 个小组数据`);

    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('添加小组数据失败:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}; 
