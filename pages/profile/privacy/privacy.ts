// 隐私政策页面
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时执行
  },
  
  // 页面分享
  onShareAppMessage() {
    return {
      title: '习惯打卡 - 隐私政策',
      path: '/pages/profile/privacy/privacy'
    };
  }
}); 
