/**
 * 成就解锁通知组件
 * 用于显示用户解锁新成就时的弹窗提示
 */

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    achievement: {
      type: Object,
      value: {}
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    animationData: {},
    showConfetti: false,
    isAnimating: false
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      // 创建动画实例
      this.animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease',
      });
    },
    ready() {
      // 如果初始状态为可见，则显示动画
      if (this.properties.visible) {
        setTimeout(() => {
          this.showAnimation();
        }, 100);
      }
    },
    detached() {
      // 清理定时器
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'visible': function(visible) {
      if (visible) {
        this.showAnimation();
      } else {
        this.hideAnimation();
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 显示动画
     */
    showAnimation() {
      // 避免重复动画
      if (this.data.isAnimating) {
        console.log('动画已在执行中，忽略重复调用');
        return;
      }
      
      // 确保动画实例存在
      if (!this.animation) {
        console.log('重新创建动画实例');
        this.animation = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease',
        });
      }
      
      // 设置动画中标记
      this.setData({
        isAnimating: true
      });
      
      console.log('开始显示成就解锁动画');
      
      // 重置动画
      this.animation.opacity(0).scale(0.8).step({ duration: 0 });
      
      // 设置初始状态
      this.setData({
        animationData: this.animation.export()
      });
      
      // 清理之前的定时器
      if (this._timer) {
        clearTimeout(this._timer);
      }
      
      // 延迟一帧执行显示动画
      this._timer = setTimeout(() => {
        this.animation.opacity(1).scale(1).step();
        
        this.setData({
          animationData: this.animation.export(),
          showConfetti: true
        });
        
        console.log('成就解锁动画显示完成');
        
        // 动画结束后重置标记
        this._timer = setTimeout(() => {
          this.setData({
            isAnimating: false
          });
        }, 300);
      }, 50);
    },
    
    /**
     * 隐藏动画
     */
    hideAnimation() {
      // 确保动画实例存在
      if (!this.animation) {
        return;
      }
      
      // 清理之前的定时器
      if (this._timer) {
        clearTimeout(this._timer);
      }
      
      this.animation.opacity(0).scale(0.8).step();
      
      this.setData({
        animationData: this.animation.export(),
        showConfetti: false,
        isAnimating: false
      });
      
      console.log('成就解锁动画已隐藏');
    },
    
    /**
     * 关闭通知
     */
    onClose() {
      this.triggerEvent('close');
    },
    
    /**
     * 查看详情
     */
    onViewDetail() {
      const { achievement } = this.properties;
      
      if (achievement && achievement.id) {
        this.triggerEvent('view', { achievementId: achievement.id });
      }
      
      this.triggerEvent('close');
    },
    
    /**
     * 分享成就
     */
    onShare() {
      this.triggerEvent('share', { achievement: this.properties.achievement });
    },
    
    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
}); 
