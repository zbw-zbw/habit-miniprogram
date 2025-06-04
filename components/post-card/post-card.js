/**
 * 动态卡片组件 - 微信朋友圈风格
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    post: {
      type: Object,
      value: {},
      observer: function (newVal, oldVal) {
        // 监听post属性变化，确保UI更新
        if (newVal !== oldVal) {
          this.setData({
            postData: newVal,
          });
        }
      },
    },
    index: {
      type: Number,
      value: 0,
    },
    isDetail: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    postData: {}, // 用于内部数据管理，确保UI更新
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化postData
      this.setData({
        postData: this.data.post,
      });
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 查看动态详情
     */
    viewPostDetail() {
      if (this.data.isDetail) return;

      const { id } = this.data.postData || this.data.post;
      this.triggerEvent('viewDetail', { postId: id });
    },

    /**
     * 查看用户资料
     */
    viewUserProfile() {
      const post = this.data.postData || this.data.post;
      const userId = post.userId || (post.user ? post.user.id : '');

      if (!userId) {
        return;
      }

      this.triggerEvent('viewUser', { userId });
    },

    /**
     * 点赞动态
     */
    likePost() {
      const post = this.data.postData || this.data.post;
      const { index } = this.data;

      // 获取动态ID，兼容不同的数据结构
      const postId = post.id || post._id;

      if (!postId) {
        wx.showToast({
          title: '操作失败',
          icon: 'none',
        });
        return;
      }

      // 立即更新UI，提供即时反馈
      const updatedPost = { ...post };
      updatedPost.isLiked = !post.isLiked;
      updatedPost.likes = post.isLiked
        ? Math.max(0, (post.likes || 0) - 1)
        : (post.likes || 0) + 1;

      this.setData({
        postData: updatedPost,
      });

      this.triggerEvent('like', { postId, index, isLiked: post.isLiked });
    },

    /**
     * 评论动态
     */
    commentPost() {
      const post = this.data.postData || this.data.post;
      const postId = post.id || post._id;

      if (!postId) {
        wx.showToast({
          title: '操作失败',
          icon: 'none',
        });
        return;
      }

      this.triggerEvent('comment', { postId });
    },

    /**
     * 查看标签
     */
    viewTag(e) {
      if (this.data.isDetail) return;

      const { tag } = e.currentTarget.dataset;
      this.triggerEvent('viewTag', { tag });
    },

    /**
     * 预览图片
     */
    previewImage(e) {
      const { index } = e.currentTarget.dataset;
      const post = this.data.postData || this.data.post;
      const { images } = post;

      if (!images || !images.length) return;

      wx.previewImage({
        current: images[index],
        urls: images,
      });
    },
  },
});
