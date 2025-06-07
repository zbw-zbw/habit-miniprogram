import { getFullImageUrl, handleImageError } from '../../utils/image';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 头像URL
    src: {
      type: String,
      value: ''
    },
    // 头像大小: small, medium, large, xlarge
    size: {
      type: String,
      value: 'medium'
    },
    // 图片裁剪模式
    mode: {
      type: String,
      value: 'aspectFill'
    },
    // 默认头像
    defaultSrc: {
      type: String,
      value: '/assets/images/default-avatar.png'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    avatarUrl: '/assets/images/default-avatar.png'
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      this.updateAvatarUrl();
    }
  },

  /**
   * 属性监听器
   */
  observers: {
    'src': function(src) {
      this.updateAvatarUrl();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新头像URL
     */
    updateAvatarUrl() {
      const { src, defaultSrc } = this.properties;
      
      if (src) {
        // 处理头像URL，确保是完整路径
        const fullUrl = getFullImageUrl(src);
        this.setData({
          avatarUrl: fullUrl
        });
      } else {
        // 使用默认头像
        this.setData({
          avatarUrl: defaultSrc
        });
      }
    },

    /**
     * 处理图片加载错误
     */
    handleImageError() {
      // 设置为默认头像
      this.setData({
        avatarUrl: this.properties.defaultSrc
      });
    },

    /**
     * 点击头像
     */
    onTap() {
      this.triggerEvent('tap');
    }
  }
}); 
 