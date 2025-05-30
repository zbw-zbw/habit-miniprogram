// packageCommunity/pages/post/post.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '', // 动态内容
    images: [], // 图片列表
    tags: [], // 标签列表
    tagInput: '', // 标签输入
    recommendTags: ['习惯养成', '早起', '阅读', '运动', '冥想', '学习', '健康饮食', '写作'],
    selectedHabit: null, // 选中的习惯
    habits: [], // 习惯列表
    showHabitModal: false, // 是否显示习惯选择器
    showLocation: false, // 是否显示位置
    locationName: '', // 位置名称
    locationInfo: null // 位置信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的习惯ID，自动选中该习惯
    if (options.habitId) {
      this.loadHabitById(options.habitId);
    } else {
      this.loadUserHabits();
    }
  },

  /**
   * 加载用户习惯列表
   */
  loadUserHabits() {
    // 模拟加载用户习惯数据
    const mockHabits = [
      {
        id: 'habit1',
        name: '每日阅读',
        icon: '/images/habits/reading.png',
        color: '#4F7CFF',
        frequency: '每天'
      },
      {
        id: 'habit2',
        name: '晨间冥想',
        icon: '/images/habits/meditation.png',
        color: '#67C23A',
        frequency: '每天'
      },
      {
        id: 'habit3',
        name: '每周健身',
        icon: '/images/habits/workout.png',
        color: '#E6A23C',
        frequency: '每周3次'
      }
    ];
    
    this.setData({ habits: mockHabits });
  },

  /**
   * 根据ID加载习惯
   */
  loadHabitById(habitId) {
    // 模拟根据ID加载习惯
    const mockHabit = {
      id: habitId,
      name: habitId === 'habit1' ? '每日阅读' : '晨间冥想',
      icon: habitId === 'habit1' ? '/images/habits/reading.png' : '/images/habits/meditation.png',
      color: habitId === 'habit1' ? '#4F7CFF' : '#67C23A',
      frequency: '每天'
    };
    
    this.setData({ 
      selectedHabit: mockHabit,
      habits: [mockHabit]
    });
    
    // 加载其他习惯
    this.loadUserHabits();
  },

  /**
   * 输入动态内容
   */
  inputContent(e) {
    this.setData({ content: e.detail.value });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const { images } = this.data;
    const count = 9 - images.length;
    
    if (count <= 0) {
      wx.showToast({
        title: '最多选择9张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: [...images, ...res.tempFilePaths]
        });
      }
    });
  },

  /**
   * 移除图片
   */
  removeImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data;
    
    images.splice(index, 1);
    
    this.setData({ images });
  },

  /**
   * 输入标签
   */
  inputTag(e) {
    const value = e.detail.value;
    
    // 如果输入空格或逗号，自动添加标签
    if (value.endsWith(' ') || value.endsWith(',')) {
      const tag = value.slice(0, -1).trim();
      if (tag) {
        this.addTagByName(tag);
        this.setData({ tagInput: '' });
      }
      return;
    }
    
    this.setData({ tagInput: value });
  },

  /**
   * 添加标签
   */
  addTag(e) {
    const { tagInput, tags } = this.data;
    
    if (tagInput.trim()) {
      this.addTagByName(tagInput.trim());
      this.setData({ tagInput: '' });
    }
  },

  /**
   * 根据名称添加标签
   */
  addTagByName(tagName) {
    const { tags } = this.data;
    
    // 标签已存在
    if (tags.includes(tagName)) {
      return;
    }
    
    // 最多添加5个标签
    if (tags.length >= 5) {
      wx.showToast({
        title: '最多添加5个标签',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      tags: [...tags, tagName]
    });
  },

  /**
   * 选择推荐标签
   */
  selectRecommendTag(e) {
    const { tag } = e.currentTarget.dataset;
    this.addTagByName(tag);
  },

  /**
   * 移除标签
   */
  removeTag(e) {
    const { index } = e.currentTarget.dataset;
    const { tags } = this.data;
    
    tags.splice(index, 1);
    
    this.setData({ tags });
  },

  /**
   * 显示习惯选择器
   */
  showHabitSelector() {
    this.setData({ showHabitModal: true });
  },

  /**
   * 隐藏习惯选择器
   */
  hideHabitSelector() {
    this.setData({ showHabitModal: false });
  },

  /**
   * 选择习惯
   */
  selectHabit(e) {
    const { habit } = e.currentTarget.dataset;
    
    this.setData({
      selectedHabit: habit,
      showHabitModal: false
    });
  },

  /**
   * 切换位置
   */
  toggleLocation() {
    const { showLocation } = this.data;
    
    if (showLocation) {
      // 取消位置
      this.setData({
        showLocation: false,
        locationName: '',
        locationInfo: null
      });
      return;
    }
    
    // 获取位置
    wx.showLoading({ title: '获取位置中' });
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        
        // 逆地理编码
        wx.request({
          url: 'https://apis.map.qq.com/ws/geocoder/v1/',
          data: {
            location: `${latitude},${longitude}`,
            key: 'YOUR_MAP_KEY' // 需要替换为实际的地图API密钥
          },
          success: (result) => {
            if (result.data.status === 0) {
              const address = result.data.result.address;
              const locationName = result.data.result.formatted_addresses.recommend;
              
              this.setData({
                showLocation: true,
                locationName: locationName || address,
                locationInfo: {
                  latitude,
                  longitude,
                  address
                }
              });
            }
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 提交动态
   */
  submitPost() {
    const { content, images, tags, selectedHabit, showLocation, locationInfo } = this.data;
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入动态内容',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '发布中' });
    
    // 构建动态数据
    const postData = {
      content: content.trim(),
      images,
      tags,
      habitId: selectedHabit ? selectedHabit.id : null,
      habitName: selectedHabit ? selectedHabit.name : null,
      location: showLocation ? locationInfo : null
    };
    
    console.log('发布动态:', postData);
    
    // 模拟发布延迟
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            // 返回上一页并刷新
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            
            if (prevPage && prevPage.refreshData) {
              prevPage.refreshData();
            }
            
            wx.navigateBack();
          }, 1500);
        }
      });
    }, 1500);
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    const { content, images } = this.data;
    
    // 如果有内容或图片，提示用户是否放弃
    if (content.trim() || images.length > 0) {
      wx.showModal({
        title: '提示',
        content: '是否放弃当前编辑？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  }
})
