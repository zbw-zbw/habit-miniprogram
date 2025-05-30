/**
 * 习惯模板数据种子脚本
 * 
 * 此脚本用于生成初始的习惯模板数据
 * 运行方式：node src/scripts/seed-templates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const HabitTemplate = require('../models/habit-template.model');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('数据库连接成功，开始插入习惯模板数据...');
  seedTemplates();
})
.catch((err) => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});

// 习惯模板数据
const templates = [
  // 健康类
  {
    name: '每日喝水',
    description: '每天喝够8杯水，保持身体水分平衡',
    category: 'health',
    icon: 'water',
    color: '#3498db',
    isSystem: true,
    defaultFrequency: {
      type: 'daily',
      days: []
    },
    defaultGoal: {
      type: 'count',
      value: 8,
      unit: '杯'
    },
    defaultTimeSettings: {
      hasTime: false
    },
    scientificBasis: '研究表明，充足的水分摄入有助于维持身体正常功能，提高新陈代谢，改善皮肤状态，并有助于排出体内毒素。',
    expectedOutcomes: [
      '提高精力水平',
      '改善皮肤质量',
      '促进新陈代谢',
      '预防头痛和疲劳'
    ],
    suggestedSteps: [
      { order: 1, description: '准备一个容量适中的水杯（约250ml）' },
      { order: 2, description: '设置定时提醒，每2小时喝一杯水' },
      { order: 3, description: '早上起床后和晚上睡前各喝一杯水' }
    ],
    faqs: [
      {
        question: '一天应该喝多少水？',
        answer: '一般建议成年人每天喝约2升水，相当于8杯250ml的水。但具体需求因个人体质、活动量和气候而异。'
      },
      {
        question: '什么时候喝水最好？',
        answer: '起床后、每餐前30分钟、运动前后、以及感到口渴时喝水效果最佳。'
      }
    ],
    tags: ['健康', '饮水', '基础习惯'],
    difficultyLevel: 1,
    estimatedFormationDays: 21,
    isPublic: true,
    isFeatured: true
  },
  {
    name: '晨间锻炼',
    description: '每天早晨进行15-30分钟的轻度运动，唤醒身体',
    category: 'health',
    icon: 'exercise',
    color: '#e74c3c',
    isSystem: true,
    defaultFrequency: {
      type: 'daily',
      days: []
    },
    defaultGoal: {
      type: 'duration',
      value: 15,
      unit: '分钟'
    },
    defaultTimeSettings: {
      hasTime: true,
      startTime: '06:30',
      endTime: '07:30'
    },
    scientificBasis: '早晨锻炼可以增强新陈代谢，提高一天的精力水平，并促进内啡肽的释放，改善情绪和认知功能。',
    expectedOutcomes: [
      '提高全天能量水平',
      '改善心情和注意力',
      '加强身体素质',
      '建立健康的生物钟'
    ],
    suggestedSteps: [
      { order: 1, description: '前一晚准备好运动装备' },
      { order: 2, description: '起床后先喝一杯水' },
      { order: 3, description: '从简单的伸展运动开始' },
      { order: 4, description: '循序渐进增加运动强度和时间' }
    ],
    tags: ['健康', '运动', '晨间习惯'],
    difficultyLevel: 3,
    estimatedFormationDays: 30,
    isPublic: true,
    isFeatured: true
  },
  
  // 学习类
  {
    name: '每日阅读',
    description: '每天阅读20分钟，培养阅读习惯和知识积累',
    category: 'learning',
    icon: 'book',
    color: '#9b59b6',
    isSystem: true,
    defaultFrequency: {
      type: 'daily',
      days: []
    },
    defaultGoal: {
      type: 'duration',
      value: 20,
      unit: '分钟'
    },
    defaultTimeSettings: {
      hasTime: false
    },
    scientificBasis: '定期阅读可以增强认知能力，提高语言表达能力，扩大知识面，并有助于减轻压力和预防认知衰退。',
    expectedOutcomes: [
      '提高专注力和理解力',
      '扩展知识面',
      '减轻压力',
      '提高语言表达能力'
    ],
    suggestedSteps: [
      { order: 1, description: '选择一本感兴趣的书籍' },
      { order: 2, description: '找一个固定的时间段（如睡前）进行阅读' },
      { order: 3, description: '逐渐增加阅读时间' },
      { order: 4, description: '尝试做些笔记或与他人分享读后感' }
    ],
    tags: ['学习', '阅读', '自我提升'],
    difficultyLevel: 2,
    estimatedFormationDays: 30,
    isPublic: true,
    isFeatured: true
  },
  
  // 工作类
  {
    name: '番茄工作法',
    description: '使用番茄工作法提高工作专注度和效率',
    category: 'work',
    icon: 'clock',
    color: '#f39c12',
    isSystem: true,
    defaultFrequency: {
      type: 'weekly',
      days: [1, 2, 3, 4, 5]
    },
    defaultGoal: {
      type: 'count',
      value: 6,
      unit: '个'
    },
    defaultTimeSettings: {
      hasTime: false
    },
    scientificBasis: '番茄工作法通过时间分块和定期休息，利用了人脑注意力集中的自然周期，提高工作效率和持久性。',
    expectedOutcomes: [
      '提高工作专注度',
      '减少拖延行为',
      '提高工作效率',
      '降低工作疲劳感'
    ],
    suggestedSteps: [
      { order: 1, description: '选择一项需要专注完成的任务' },
      { order: 2, description: '设置25分钟的计时器' },
      { order: 3, description: '在这25分钟内只专注于该任务' },
      { order: 4, description: '计时结束后休息5分钟' },
      { order: 5, description: '完成4个番茄钟后，休息较长时间（15-30分钟）' }
    ],
    tags: ['工作', '效率', '时间管理'],
    difficultyLevel: 2,
    estimatedFormationDays: 14,
    isPublic: true,
    isFeatured: true
  },
  
  // 社交类
  {
    name: '感恩日记',
    description: '每天记录3件值得感恩的事情，培养积极心态',
    category: 'social',
    icon: 'heart',
    color: '#2ecc71',
    isSystem: true,
    defaultFrequency: {
      type: 'daily',
      days: []
    },
    defaultGoal: {
      type: 'count',
      value: 3,
      unit: '件事'
    },
    defaultTimeSettings: {
      hasTime: true,
      startTime: '21:00',
      endTime: '23:00'
    },
    scientificBasis: '心理学研究表明，记录感恩事项可以提高幸福感，减轻抑郁症状，改善睡眠质量，并促进更积极的人际关系。',
    expectedOutcomes: [
      '提高幸福感和满足感',
      '减少负面情绪',
      '改善人际关系',
      '培养积极思维模式'
    ],
    suggestedSteps: [
      { order: 1, description: '准备一个专门的笔记本或使用应用程序' },
      { order: 2, description: '每晚睡前花5分钟时间反思当天' },
      { order: 3, description: '具体记录3件让你感到感恩的事情' },
      { order: 4, description: '思考为什么这些事情让你感到感恩' }
    ],
    tags: ['社交', '心理健康', '正念'],
    difficultyLevel: 1,
    estimatedFormationDays: 21,
    isPublic: true,
    isFeatured: true
  },
  
  // 财务类
  {
    name: '记账习惯',
    description: '每天记录个人支出，掌握财务状况',
    category: 'finance',
    icon: 'wallet',
    color: '#27ae60',
    isSystem: true,
    defaultFrequency: {
      type: 'daily',
      days: []
    },
    defaultGoal: {
      type: 'completion',
      value: 1,
      unit: '次'
    },
    defaultTimeSettings: {
      hasTime: false
    },
    scientificBasis: '定期记账和财务追踪是财务健康的基础，可以帮助了解消费模式，控制支出，培养储蓄习惯，实现财务目标。',
    expectedOutcomes: [
      '清晰了解个人财务状况',
      '识别不必要的支出',
      '培养储蓄意识',
      '减轻财务压力'
    ],
    suggestedSteps: [
      { order: 1, description: '选择一个记账工具（应用或笔记本）' },
      { order: 2, description: '建立支出分类（如食物、交通、娱乐等）' },
      { order: 3, description: '每次消费后立即记录' },
      { order: 4, description: '每周进行一次支出分析' }
    ],
    tags: ['财务', '记账', '理财'],
    difficultyLevel: 2,
    estimatedFormationDays: 30,
    isPublic: true,
    isFeatured: false
  }
];

// 插入习惯模板数据
async function seedTemplates() {
  try {
    // 清空现有系统模板
    await HabitTemplate.deleteMany({ isSystem: true });
    console.log('已清空现有系统模板数据');
    
    // 插入新模板
    const result = await HabitTemplate.insertMany(templates);
    console.log(`成功插入 ${result.length} 个习惯模板`);
    
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('插入习惯模板数据失败:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// 处理异常
process.on('SIGINT', () => {
  mongoose.disconnect();
  console.log('数据库连接已关闭');
  process.exit(0);
}); 
