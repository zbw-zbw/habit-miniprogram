"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 发布动态页面
const api_1 = require("../../../services/api");
const use_auth_1 = require("../../../utils/use-auth");
Page({
    data: {
        // 内容
        content: '',
        contentLength: 0,
        // 图片
        fileList: [],
        // 标签
        tags: ['习惯养成', '健康生活', '运动健身', '学习成长', '早起早睡', '饮食健康', '冥想放松', '阅读', '写作', '戒烟戒酒'],
        selectedTags: [],
        showTagSelector: false,
        // 习惯
        habits: [],
        habitIndex: -1,
        showHabitSelector: false,
        // 小组
        groupId: '',
        groupName: '',
        // 状态
        isSubmitting: false,
        canSubmit: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 检查登录状态
        const { hasLogin } = (0, use_auth_1.getAuthState)();
        if (!hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
            return;
        }
        // 如果有小组ID和名称参数，设置小组信息
        if (options.groupId && options.groupName) {
            this.setData({
                groupId: options.groupId,
                groupName: decodeURIComponent(options.groupName)
            });
        }
        // 加载习惯列表
        this.loadHabits();
    },
    /**
     * 加载习惯列表
     */
    loadHabits() {
        api_1.habitAPI.getHabits()
            .then(habits => {
            this.setData({ habits });
        })
            .catch(error => {
            console.error('获取习惯列表失败:', error);
        });
    },
    /**
     * 内容输入事件
     */
    onContentInput(e) {
        const content = e.detail.value;
        this.setData({
            content,
            contentLength: content.length,
            canSubmit: content.trim().length > 0
        });
    },
    /**
     * 图片上传完成
     */
    afterRead(e) {
        const { file } = e.detail;
        // 处理单个文件上传
        if (!Array.isArray(file)) {
            this.uploadSingleFile(file);
            return;
        }
        // 处理多个文件上传
        file.forEach((item) => {
            this.uploadSingleFile(item);
        });
    },
    /**
     * 上传单个文件
     */
    uploadSingleFile(file) {
        // 添加到文件列表，状态为上传中
        const fileList = [...this.data.fileList];
        fileList.push({
            ...file,
            status: 'uploading',
            message: '上传中'
        });
        this.setData({ fileList });
        // 上传图片
        api_1.communityAPI.uploadImage(file.url)
            .then(res => {
            // 更新文件状态为上传成功
            const index = fileList.findIndex(item => item.url === file.url);
            if (index !== -1) {
                fileList[index].status = 'done';
                fileList[index].url = res.url;
                delete fileList[index].message;
                this.setData({ fileList });
            }
        })
            .catch(error => {
            // 更新文件状态为上传失败
            const index = fileList.findIndex(item => item.url === file.url);
            if (index !== -1) {
                fileList[index].status = 'failed';
                fileList[index].message = '上传失败';
                this.setData({ fileList });
            }
            wx.showToast({
                title: '图片上传失败',
                icon: 'none'
            });
        });
    },
    /**
     * 删除图片
     */
    onDelete(e) {
        const { index } = e.detail;
        const fileList = [...this.data.fileList];
        fileList.splice(index, 1);
        this.setData({ fileList });
    },
    /**
     * 图片大小超限
     */
    onOversize() {
        wx.showToast({
            title: '图片大小不能超过10MB',
            icon: 'none'
        });
    },
    /**
     * 切换标签选择器
     */
    toggleTagSelector() {
        this.setData({
            showTagSelector: !this.data.showTagSelector,
            showHabitSelector: false
        });
    },
    /**
     * 切换习惯选择器
     */
    toggleHabitSelector() {
        this.setData({
            showHabitSelector: !this.data.showHabitSelector,
            showTagSelector: false
        });
    },
    /**
     * 选择/取消选择标签
     */
    toggleTag(e) {
        const { tag } = e.currentTarget.dataset;
        const selectedTags = [...this.data.selectedTags];
        const index = selectedTags.indexOf(tag);
        if (index === -1) {
            // 最多选择5个标签
            if (selectedTags.length >= 5) {
                wx.showToast({
                    title: '最多选择5个标签',
                    icon: 'none'
                });
                return;
            }
            selectedTags.push(tag);
        }
        else {
            selectedTags.splice(index, 1);
        }
        this.setData({ selectedTags });
    },
    /**
     * 选择习惯
     */
    onHabitChange(e) {
        this.setData({
            habitIndex: parseInt(e.detail.value)
        });
    },
    /**
     * 提交动态
     */
    submitPost() {
        if (!this.data.content.trim()) {
            wx.showToast({
                title: '请输入内容',
                icon: 'none'
            });
            return;
        }
        // 检查是否有图片正在上传
        const isUploading = this.data.fileList.some(file => file.status === 'uploading');
        if (isUploading) {
            wx.showToast({
                title: '图片上传中，请稍候',
                icon: 'none'
            });
            return;
        }
        this.setData({ isSubmitting: true });
        // 构建动态数据
        const postData = {
            content: this.data.content,
            images: this.data.fileList.map(file => file.url),
            tags: this.data.selectedTags,
            habitId: this.data.habitIndex !== -1 ? this.data.habits[this.data.habitIndex].id : undefined,
            groupId: this.data.groupId || undefined
        };
        // 调用API创建动态
        api_1.communityAPI.createPost(postData)
            .then((result) => {
            wx.showToast({
                title: '发布成功',
                icon: 'success'
            });
            // 如果是在小组内发布，尝试刷新小组详情页面的动态列表
            if (this.data.groupId) {
                // 获取页面栈
                const pages = getCurrentPages();
                // 查找小组详情页面
                const groupDetailPage = pages.find(page => page.route && page.route.includes('pages/community/groups/detail/detail'));
                if (groupDetailPage) {
                    // 调用小组详情页面的刷新方法
                    groupDetailPage.loadPosts(true);
                }
            }
            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        })
            .catch(error => {
            console.error('发布动态失败:', error);
            wx.showToast({
                title: '发布失败',
                icon: 'none'
            });
        })
            .finally(() => {
            this.setData({ isSubmitting: false });
        });
    }
});
