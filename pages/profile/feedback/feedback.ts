// 意见反馈页面
Page({
  data: {
    activeType: 'bug', // 默认选择问题反馈
    content: '', // 反馈内容
    contentLength: 0, // 反馈内容字数
    images: [] as string[], // 上传的图片
    contact: '', // 联系方式
    canSubmit: false, // 是否可以提交
    showSuccess: false // 是否显示提交成功弹窗
  },

  onLoad() {
    // 页面加载时执行
  },

  // 选择反馈类型
  selectType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      activeType: type
    });
    this.checkCanSubmit();
  },

  // 输入反馈内容
  inputContent(e: WechatMiniprogram.Input) {
    const content = e.detail.value;
    const contentLength = content.length;
    this.setData({
      content,
      contentLength
    });
    this.checkCanSubmit();
  },

  // 输入联系方式
  inputContact(e: WechatMiniprogram.Input) {
    this.setData({
      contact: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const { images } = this.data;
    const count = 3 - images.length;
    
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 返回选定照片的本地文件路径列表
        const tempFilePaths = res.tempFilePaths;
        
        // 上传图片
        this.setData({
          images: [...images, ...tempFilePaths]
        });
      }
    });
  },

  // 预览图片
  previewImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const { images } = this.data;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 删除图片
  deleteImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const { images } = this.data;
    
    images.splice(index, 1);
    this.setData({
      images
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { activeType, content } = this.data;
    
    // 必须选择反馈类型且反馈内容不少于10个字
    const canSubmit = !!activeType && content.length >= 10;
    
    this.setData({
      canSubmit
    });
  },

  // 提交反馈
  submitFeedback() {
    const { canSubmit, activeType, content, images, contact } = this.data;
    
    if (!canSubmit) {
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 模拟提交
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示提交成功弹窗
      this.setData({
        showSuccess: true
      });
      
      // 清空表单
      this.resetForm();
    }, 1500);
  },

  // 重置表单
  resetForm() {
    this.setData({
      activeType: 'bug',
      content: '',
      contentLength: 0,
      images: [],
      contact: '',
      canSubmit: false
    });
  },

  // 关闭成功弹窗
  closeSuccess() {
    this.setData({
      showSuccess: false
    });
    
    // 返回上一页
    wx.navigateBack();
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '意见反馈 - 习惯打卡',
      path: '/pages/index/index'
    };
  }
}); 
