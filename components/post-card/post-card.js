/**
 * 动态卡片组件
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    post: {
      type: Object,
      value: {}
    },
    index: {
      type: Number,
      value: 0
    },
    isDetail: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 查看动态详情
     */
    viewPostDetail() {
      const { id } = this.data.post;
      this.triggerEvent('viewDetail', { id });
    },

    /**
     * 查看用户资料
     */
    viewUserProfile() {
      const post = this.data.post;
      const userId = post.userId || (post.user ? post.user.id : '');
      
      if (!userId) {
        console.warn('无法获取用户ID:', post);
        return;
      }
      
      this.triggerEvent('viewUser', { userId });
    },

    /**
     * 点赞动态
     */
    likePost() {
      const { id } = this.data.post;
      const { index } = this.data;
      this.triggerEvent('like', { id, index });
    },

    /**
     * 评论动态
     */
    commentPost() {
      const { id } = this.data.post;
      this.triggerEvent('comment', { id });
    },

    /**
     * 分享动态
     */
    sharePost() {
      const { id } = this.data.post;
      this.triggerEvent('share', { id });
    },

    /**
     * 查看标签
     */
    viewTag(e) {
      const { tag } = e.currentTarget.dataset;
      this.triggerEvent('viewTag', { tag });
    },

    /**
     * 预览图片
     */
    previewImage(e) {
      const { index } = e.currentTarget.dataset;
      const { images } = this.data.post;
      this.triggerEvent('previewImage', { index, images });
    }
  }
}) 
