/**
 * 创建挑战页面
 */
import { communityAPI } from '../../../../services/api';
import { useAuth } from '../../../../utils/use-auth';

interface IFormData {
  image: string;
  title: string;
  type: string;
  duration: number;
  startDate: string;
  description: string;
  rules: string;
  tags: string[];
  needsApproval: boolean;
}

interface IPageData {
  formData: IFormData;
  typeOptions: Array<{value: string, label: string}>;
  typeIndex: number;
  durationOptions: Array<{value: number, label: string}>;
  durationIndex: number;
  minDate: string;
  formValid: boolean;
  showTagSelector: boolean;
  suggestedTags: string[];
  newTag: string;
  tempTags: string[];
  hasLogin: boolean;
}

Page<IPageData, {
  goBack(): void;
  chooseCover(): void;
  inputTitle(e: WechatMiniprogram.Input): void;
  typeChange(e: WechatMiniprogram.PickerChange): void;
  durationChange(e: WechatMiniprogram.PickerChange): void;
  startDateChange(e: WechatMiniprogram.DatePickerChange): void;
  inputDescription(e: WechatMiniprogram.Input): void;
  inputRules(e: WechatMiniprogram.Input): void;
  showTagSelector(): void;
  hideTagSelector(): void;
  preventBubble(): void;
  toggleTag(e: WechatMiniprogram.TouchEvent): void;
  inputNewTag(e: WechatMiniprogram.Input): void;
  addCustomTag(): void;
  confirmTags(): void;
  removeTag(e: WechatMiniprogram.TouchEvent): void;
  switchApproval(e: WechatMiniprogram.SwitchChange): void;
  submitForm(e: WechatMiniprogram.FormSubmit): void;
  uploadCover(filePath: string): Promise<string>;
  validateForm(): boolean;
  formatDate(date: Date): string;
}>({
  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      image: '',
      title: '',
      type: 'fitness',
      duration: 7,
      startDate: '',
      description: '',
      rules: '',
      tags: [],
      needsApproval: false
    },
    typeOptions: [
      { value: 'fitness', label: '健康健身' },
      { value: 'reading', label: '阅读学习' },
      { value: 'lifestyle', label: '生活习惯' },
      { value: 'productivity', label: '效率提升' },
      { value: 'other', label: '其他' }
    ],
    typeIndex: 0,
    durationOptions: [
      { value: 7, label: '7天' },
      { value: 14, label: '14天' },
      { value: 21, label: '21天' },
      { value: 30, label: '30天' },
      { value: 60, label: '60天' },
      { value: 90, label: '90天' }
    ],
    durationIndex: 0,
    minDate: '',
    formValid: false,
    showTagSelector: false,
    suggestedTags: [
      '健身', '跑步', '阅读', '写作', '冥想',
      '早起', '喝水', '学习', '英语', '编程',
      '减肥', '戒烟', '戒酒', '戒糖', '戒网瘾'
    ],
    newTag: '',
    tempTags: [],
    hasLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);
    
    // 检查登录状态
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
      return;
    }
    
    // 设置默认开始日期为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.setData({
      'formData.startDate': this.formatDate(tomorrow),
      minDate: this.formatDate(tomorrow)
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 选择封面
   */
  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 更新表单数据
        this.setData({
          'formData.image': tempFilePath
        });
        
        // 验证表单
        this.validateForm();
      }
    });
  },

  /**
   * 输入标题
   */
  inputTitle(e: WechatMiniprogram.Input) {
    this.setData({
      'formData.title': e.detail.value
    });
    
    // 验证表单
    this.validateForm();
  },

  /**
   * 切换类型
   */
  typeChange(e: WechatMiniprogram.PickerChange) {
    const index = e.detail.value as number;
    
    this.setData({
      typeIndex: index,
      'formData.type': this.data.typeOptions[index].value
    });
  },

  /**
   * 切换时长
   */
  durationChange(e: WechatMiniprogram.PickerChange) {
    const index = e.detail.value as number;
    
    this.setData({
      durationIndex: index,
      'formData.duration': this.data.durationOptions[index].value
    });
  },

  /**
   * 选择开始日期
   */
  startDateChange(e: WechatMiniprogram.DatePickerChange) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  /**
   * 输入描述
   */
  inputDescription(e: WechatMiniprogram.Input) {
    this.setData({
      'formData.description': e.detail.value
    });
    
    // 验证表单
    this.validateForm();
  },

  /**
   * 输入规则
   */
  inputRules(e: WechatMiniprogram.Input) {
    this.setData({
      'formData.rules': e.detail.value
    });
    
    // 验证表单
    this.validateForm();
  },

  /**
   * 显示标签选择器
   */
  showTagSelector() {
    // 复制当前标签到临时标签
    this.setData({
      tempTags: [...this.data.formData.tags],
      showTagSelector: true
    });
  },

  /**
   * 隐藏标签选择器
   */
  hideTagSelector() {
    this.setData({
      showTagSelector: false
    });
  },

  /**
   * 阻止冒泡
   */
  preventBubble() {
    // 阻止点击事件冒泡
  },

  /**
   * 切换标签选择状态
   */
  toggleTag(e: WechatMiniprogram.TouchEvent) {
    const tag = e.currentTarget.dataset.tag as string;
    const tempTags = [...this.data.tempTags];
    
    const index = tempTags.indexOf(tag);
    if (index > -1) {
      // 已选中，取消选择
      tempTags.splice(index, 1);
    } else {
      // 未选中，添加选择
      if (tempTags.length >= 5) {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
      tempTags.push(tag);
    }
    
    this.setData({
      tempTags
    });
  },

  /**
   * 输入新标签
   */
  inputNewTag(e: WechatMiniprogram.Input) {
    this.setData({
      newTag: e.detail.value
    });
  },

  /**
   * 添加自定义标签
   */
  addCustomTag() {
    const { newTag, tempTags } = this.data;
    
    if (!newTag.trim()) {
      return;
    }
    
    if (tempTags.length >= 5) {
      wx.showToast({
        title: '最多选择5个标签',
        icon: 'none'
      });
      return;
    }
    
    if (tempTags.includes(newTag.trim())) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      tempTags: [...tempTags, newTag.trim()],
      newTag: ''
    });
  },

  /**
   * 确认标签选择
   */
  confirmTags() {
    this.setData({
      'formData.tags': this.data.tempTags,
      showTagSelector: false
    });
  },

  /**
   * 删除标签
   */
  removeTag(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const tags = [...this.data.formData.tags];
    
    tags.splice(index, 1);
    
    this.setData({
      'formData.tags': tags
    });
  },

  /**
   * 切换审核状态
   */
  switchApproval(e: WechatMiniprogram.SwitchChange) {
    this.setData({
      'formData.needsApproval': e.detail.value
    });
  },

  /**
   * 提交表单
   */
  submitForm(e: WechatMiniprogram.FormSubmit) {
    // 验证表单
    if (!this.validateForm()) {
      return;
    }
    
    wx.showLoading({
      title: '创建中'
    });
    
    const { formData } = this.data;
    
    // 如果有封面，先上传封面
    const uploadCoverPromise = formData.image 
      ? this.uploadCover(formData.image)
      : Promise.resolve('');
    
    uploadCoverPromise
      .then((imageUrl) => {
        // 创建挑战
        return communityAPI.createChallenge({
          title: formData.title,
          type: formData.type,
          duration: formData.duration,
          startDate: formData.startDate,
          description: formData.description,
          rules: formData.rules,
          tags: formData.tags,
          needsApproval: formData.needsApproval,
          image: imageUrl || undefined
        });
      })
      .then((challenge) => {
        wx.hideLoading();
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        // 返回上一页并刷新
        setTimeout(() => {
          // 返回并传递刷新标志
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage) {
            // 调用上一页的刷新方法
            prevPage.refreshData && prevPage.refreshData();
          }
          wx.navigateBack();
        }, 1500);
      })
      .catch((error) => {
        console.error('创建挑战失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        });
      });
  },

  /**
   * 上传封面
   */
  uploadCover(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 如果是临时文件路径，需要上传
      if (filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp')) {
        communityAPI.uploadImage(filePath)
          .then(result => {
            resolve(result.url);
          })
          .catch(error => {
            console.error('上传封面失败:', error);
            reject(error);
          });
      } else {
        // 已经是网络路径，直接返回
        resolve(filePath);
      }
    });
  },

  /**
   * 验证表单
   */
  validateForm(): boolean {
    const { formData } = this.data;
    
    // 验证标题
    if (!formData.title.trim() || formData.title.length < 5) {
      this.setData({ formValid: false });
      return false;
    }
    
    // 验证描述
    if (!formData.description.trim() || formData.description.length < 20) {
      this.setData({ formValid: false });
      return false;
    }
    
    // 验证规则
    if (!formData.rules.trim() || formData.rules.length < 20) {
      this.setData({ formValid: false });
      return false;
    }
    
    // 表单有效
    this.setData({ formValid: true });
    return true;
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}); 
