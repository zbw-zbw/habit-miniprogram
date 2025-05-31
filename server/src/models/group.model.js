/**
 * 小组模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['habit', 'challenge', 'topic', 'other'],
    default: 'habit'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    default: '/assets/images/groups.png'
  },
  coverImage: {
    type: String,
    default: '/assets/images/groups.png'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  membersCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ creator: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Group', groupSchema); 
