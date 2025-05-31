"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 创建小组页面
 */
const api_1 = require("../../../../services/api");
const use_auth_1 = require("../../../../utils/use-auth");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        formData: {
            avatar: '',
            name: '',
            type: 'hobby',
            description: '',
            tags: [],
            isPrivate: false
        },
        typeOptions: [
            { value: 'hobby', label: '兴趣爱好' },
            { value: 'study', label: '学习成长' },
            { value: 'fitness', label: '健康健身' },
            { value: 'lifestyle', label: '生活方式' },
            { value: 'work', label: '工作技能' },
            { value: 'other', label: '其他' }
        ],
        typeIndex: 0,
        formValid: false,
        showTagSelector: false,
        suggestedTags: [
            '阅读', '写作', '运动', '健身', '冥想',
            '编程', '绘画', '音乐', '摄影', '烹饪',
            '旅行', '语言', '理财', '手工', '瑜伽'
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
        (0, use_auth_1.useAuth)(this);
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
    },
    /**
     * 返回上一页
     */
    goBack() {
        wx.navigateBack();
    },
    /**
     * 选择头像
     */
    chooseAvatar() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];
                // 更新表单数据
                this.setData({
                    'formData.avatar': tempFilePath
                });
                // 验证表单
                this.validateForm();
            }
        });
    },
    /**
     * 输入名称
     */
    inputName(e) {
        this.setData({
            'formData.name': e.detail.value
        });
        // 验证表单
        this.validateForm();
    },
    /**
     * 切换类型
     */
    typeChange(e) {
        const index = e.detail.value;
        this.setData({
            typeIndex: index,
            'formData.type': this.data.typeOptions[index].value
        });
        // 验证表单
        this.validateForm();
    },
    /**
     * 输入描述
     */
    inputDescription(e) {
        this.setData({
            'formData.description': e.detail.value
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
    toggleTag(e) {
        const tag = e.currentTarget.dataset.tag;
        const tempTags = [...this.data.tempTags];
        const index = tempTags.indexOf(tag);
        if (index > -1) {
            // 已选中，取消选择
            tempTags.splice(index, 1);
        }
        else {
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
    inputNewTag(e) {
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
    removeTag(e) {
        const index = e.currentTarget.dataset.index;
        const tags = [...this.data.formData.tags];
        tags.splice(index, 1);
        this.setData({
            'formData.tags': tags
        });
    },
    /**
     * 切换私密状态
     */
    switchPrivate(e) {
        this.setData({
            'formData.isPrivate': e.detail.value
        });
    },
    /**
     * 提交表单
     */
    submitForm(e) {
        // 验证表单
        if (!this.validateForm()) {
            return;
        }
        wx.showLoading({
            title: '创建中'
        });
        const { formData } = this.data;
        // 如果有头像，先上传头像
        const uploadAvatarPromise = formData.avatar
            ? this.uploadAvatar(formData.avatar)
            : Promise.resolve('');
        uploadAvatarPromise
            .then((avatarUrl) => {
            // 创建小组
            return api_1.communityAPI.createGroup({
                name: formData.name,
                type: formData.type,
                description: formData.description,
                tags: formData.tags,
                isPrivate: formData.isPrivate,
                avatar: avatarUrl || undefined
            });
        })
            .then((group) => {
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
            console.error('创建小组失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: '创建失败',
                icon: 'none'
            });
        });
    },
    /**
     * 上传头像
     */
    uploadAvatar(filePath) {
        return new Promise((resolve, reject) => {
            // 如果是临时文件路径，需要上传
            if (filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp')) {
                api_1.communityAPI.uploadImage(filePath)
                    .then(result => {
                    resolve(result.url);
                })
                    .catch(error => {
                    console.error('上传头像失败:', error);
                    reject(error);
                });
            }
            else {
                // 已经是网络路径，直接返回
                resolve(filePath);
            }
        });
    },
    /**
     * 验证表单
     */
    validateForm() {
        const { formData } = this.data;
        // 验证名称
        if (!formData.name.trim() || formData.name.length < 2) {
            this.setData({ formValid: false });
            return false;
        }
        // 验证描述
        if (!formData.description.trim() || formData.description.length < 10) {
            this.setData({ formValid: false });
            return false;
        }
        // 表单有效
        this.setData({ formValid: true });
        return true;
    }
});
