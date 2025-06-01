"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 创建挑战页面
 */
const api_1 = require("../../../../services/api");
const use_auth_1 = require("../../../../utils/use-auth");
Page({
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
        hasLogin: false,
        titleError: '',
        descriptionError: '',
        rulesError: ''
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
        // 设置默认开始日期为明天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.setData({
            'formData.startDate': this.formatDate(tomorrow),
            minDate: this.formatDate(tomorrow),
            tempTags: [] // 初始化临时标签数组
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
                // 验证标题
                this.validateTitle();
                // 验证整个表单
                this.validateForm();
            }
        });
    },
    /**
     * 输入标题
     */
    inputTitle(e) {
        this.setData({
            'formData.title': e.detail.value
        });
        // 验证标题
        this.validateTitle();
        // 验证整个表单
        this.validateForm();
    },
    /**
     * 切换类型
     */
    typeChange(e) {
        const index = Number(e.detail.value);
        this.setData({
            typeIndex: index,
            'formData.type': this.data.typeOptions[index].value
        });
    },
    /**
     * 切换时长
     */
    durationChange(e) {
        const index = Number(e.detail.value);
        this.setData({
            durationIndex: index,
            'formData.duration': this.data.durationOptions[index].value
        });
    },
    /**
     * 选择开始日期
     */
    startDateChange(e) {
        this.setData({
            'formData.startDate': e.detail.value
        });
    },
    /**
     * 输入描述
     */
    inputDescription(e) {
        this.setData({
            'formData.description': e.detail.value
        });
        // 验证描述
        this.validateDescription();
        // 验证整个表单
        this.validateForm();
    },
    /**
     * 输入规则
     */
    inputRules(e) {
        this.setData({
            'formData.rules': e.detail.value
        });
        // 验证规则
        this.validateRules();
        // 验证整个表单
        this.validateForm();
    },
    /**
     * 显示标签选择器
     */
    showTagSelector() {
        this.setData({
            showTagSelector: true,
            tempTags: [...this.data.formData.tags] // 复制当前标签到临时标签
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
        // 阻止事件冒泡
        return;
    },
    /**
     * 切换标签选择
     */
    toggleTag(e) {
        const tag = e.currentTarget.dataset.tag;
        const { tempTags } = this.data;
        // 检查标签是否已选择
        const tagIndex = tempTags.indexOf(tag);
        if (tagIndex === -1) {
            // 标签未选择，添加标签
            if (tempTags.length >= 5) {
                wx.showToast({
                    title: '最多选择5个标签',
                    icon: 'none'
                });
                return;
            }
            this.setData({
                tempTags: [...tempTags, tag]
            });
        }
        else {
            // 标签已选择，移除标签
            const newTags = [...tempTags];
            newTags.splice(tagIndex, 1);
            this.setData({
                tempTags: newTags
            });
        }
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
        const { newTag, tempTags, suggestedTags } = this.data;
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
        const newTagTrimmed = newTag.trim();
        // 添加到临时标签
        this.setData({
            tempTags: [...tempTags, newTagTrimmed],
            newTag: ''
        });
        // 如果不在建议标签中，也添加到建议标签列表
        if (!suggestedTags.includes(newTagTrimmed)) {
            this.setData({
                suggestedTags: [...suggestedTags, newTagTrimmed]
            });
        }
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
     * 切换审核状态
     */
    switchApproval(e) {
        this.setData({
            'formData.needsApproval': e.detail.value
        });
    },
    /**
     * 提交表单
     */
    submitForm(e) {
        // 验证表单
        if (!this.validateForm()) {
            wx.showToast({
                title: '请完善表单信息',
                icon: 'none'
            });
            return;
        }
        wx.showLoading({
            title: '创建中'
        });
        const { formData } = this.data;
        console.log('准备提交的表单数据:', formData);
        // 如果有封面，先上传封面
        const uploadCoverPromise = formData.image
            ? this.uploadCover(formData.image)
            : Promise.resolve('');
        uploadCoverPromise
            .then((imageUrl) => {
            console.log('封面上传成功, URL:', imageUrl);
            // 准备提交的数据
            const challengeData = {
                title: formData.title,
                description: formData.description,
                rules: formData.rules,
                duration: formData.duration,
                startDate: formData.startDate,
                tags: formData.tags,
                needsApproval: formData.needsApproval,
                image: imageUrl || undefined,
                isPublic: true
            };
            console.log('发送到服务器的数据:', challengeData);
            // 创建挑战
            return api_1.communityAPI.createChallenge(challengeData);
        })
            .then((challenge) => {
            console.log('挑战创建成功:', challenge);
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
            // 尝试解析错误详情
            let errorMsg = '创建失败';
            if (error && error.message) {
                errorMsg = error.message;
            }
            else if (typeof error === 'string') {
                errorMsg = error;
            }
            // 检查是否是网络请求错误
            if (error && error.statusCode) {
                console.error('HTTP错误状态码:', error.statusCode);
                console.error('HTTP错误响应:', error.data);
                if (error.statusCode === 404) {
                    errorMsg = 'API接口不存在，请联系管理员';
                }
                else if (error.statusCode === 401) {
                    errorMsg = '登录已过期，请重新登录';
                }
                else if (error.statusCode >= 500) {
                    errorMsg = '服务器错误，请稍后再试';
                }
            }
            wx.hideLoading();
            wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2000
            });
        });
    },
    /**
     * 上传封面
     */
    uploadCover(filePath) {
        return new Promise((resolve, reject) => {
            // 如果是临时文件路径，需要上传
            if (filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp')) {
                api_1.communityAPI.uploadImage(filePath)
                    .then(result => {
                    resolve(result.url);
                })
                    .catch(error => {
                    console.error('上传封面失败:', error);
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
     * 验证标题
     */
    validateTitle() {
        const { title } = this.data.formData;
        if (!title.trim()) {
            this.setData({ titleError: '请输入挑战标题' });
            return false;
        }
        if (title.length < 5) {
            this.setData({ titleError: '标题至少需要5个字符' });
            return false;
        }
        this.setData({ titleError: '' });
        return true;
    },
    /**
     * 验证描述
     */
    validateDescription() {
        const { description } = this.data.formData;
        if (!description.trim()) {
            this.setData({ descriptionError: '请输入挑战描述' });
            return false;
        }
        if (description.length < 20) {
            this.setData({ descriptionError: '描述至少需要20个字符' });
            return false;
        }
        this.setData({ descriptionError: '' });
        return true;
    },
    /**
     * 验证规则
     */
    validateRules() {
        const { rules } = this.data.formData;
        if (!rules.trim()) {
            this.setData({ rulesError: '请输入挑战规则' });
            return false;
        }
        if (rules.length < 20) {
            this.setData({ rulesError: '规则至少需要20个字符' });
            return false;
        }
        this.setData({ rulesError: '' });
        return true;
    },
    /**
     * 验证表单
     */
    validateForm() {
        const titleValid = this.validateTitle();
        const descriptionValid = this.validateDescription();
        const rulesValid = this.validateRules();
        const formValid = titleValid && descriptionValid && rulesValid;
        this.setData({ formValid });
        return formValid;
    },
    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    /**
     * 刷新数据方法，供上一页面调用
     */
    refreshData() {
        console.log('创建挑战页面刷新数据');
        // 这个方法会被上一页面调用，不需要实现具体逻辑
    }
});
