"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
/**
 * 创建小组页面
 */
var api_1 = require("../../../../services/api");
var use_auth_1 = require("../../../../utils/use-auth");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        formData: {
            avatar: '',
            name: '',
            type: 'habit',
            description: '',
            tags: [],
            isPrivate: false
        },
        typeOptions: [
            { value: 'habit', label: '习惯养成' },
            { value: 'challenge', label: '挑战活动' },
            { value: 'topic', label: '主题讨论' },
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
        hasLogin: false,
        nameError: '',
        descriptionError: ''
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 检查登录状态
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
                success: function () {
                    setTimeout(function () {
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
    goBack: function () {
        wx.navigateBack();
    },
    /**
     * 选择头像
     */
    chooseAvatar: function () {
        var _this = this;
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                var tempFilePath = res.tempFilePaths[0];
                // 更新表单数据
                _this.setData({
                    'formData.avatar': tempFilePath
                });
                // 验证表单
                _this.validateForm();
            }
        });
    },
    /**
     * 输入名称
     */
    inputName: function (e) {
        this.setData({
            'formData.name': e.detail.value,
            nameError: ''
        });
        // 验证表单
        this.validateForm();
    },
    /**
     * 切换类型
     */
    typeChange: function (e) {
        var index = parseInt(e.detail.value);
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
    inputDescription: function (e) {
        this.setData({
            'formData.description': e.detail.value,
            descriptionError: ''
        });
        // 验证表单
        this.validateForm();
    },
    /**
     * 显示标签选择器
     */
    showTagSelector: function () {
        // 复制当前标签到临时标签
        this.setData({
            tempTags: __spreadArray([], this.data.formData.tags, true),
            showTagSelector: true
        });
    },
    /**
     * 隐藏标签选择器
     */
    hideTagSelector: function () {
        this.setData({
            showTagSelector: false
        });
    },
    /**
     * 阻止冒泡
     */
    preventBubble: function () {
        // 阻止点击事件冒泡
    },
    /**
     * 切换标签选择状态
     */
    toggleTag: function (e) {
        var tag = e.currentTarget.dataset.tag;
        var tempTags = __spreadArray([], this.data.tempTags, true);
        var index = tempTags.indexOf(tag);
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
            tempTags: tempTags
        });
    },
    /**
     * 输入新标签
     */
    inputNewTag: function (e) {
        this.setData({
            newTag: e.detail.value
        });
    },
    /**
     * 添加自定义标签
     */
    addCustomTag: function () {
        var _a = this.data, newTag = _a.newTag, tempTags = _a.tempTags;
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
            tempTags: __spreadArray(__spreadArray([], tempTags, true), [newTag.trim()], false),
            newTag: ''
        });
    },
    /**
     * 确认标签选择
     */
    confirmTags: function () {
        this.setData({
            'formData.tags': this.data.tempTags,
            showTagSelector: false
        });
    },
    /**
     * 删除标签
     */
    removeTag: function (e) {
        var index = e.currentTarget.dataset.index;
        var tags = __spreadArray([], this.data.formData.tags, true);
        tags.splice(index, 1);
        this.setData({
            'formData.tags': tags
        });
    },
    /**
     * 切换私密状态
     */
    switchPrivate: function (e) {
        this.setData({
            'formData.isPrivate': e.detail.value
        });
    },
    /**
     * 提交表单
     */
    submitForm: function (e) {
        // 验证表单
        if (!this.validateForm()) {
            return;
        }
        wx.showLoading({
            title: '创建中'
        });
        var formData = this.data.formData;
        // 如果有头像，先上传头像
        var uploadAvatarPromise = formData.avatar
            ? this.uploadAvatar(formData.avatar)
            : Promise.resolve('');
        uploadAvatarPromise
            .then(function (avatarUrl) {
            // 创建小组
            return api_1.communityAPI.createGroup({
                name: formData.name,
                description: formData.description,
                tags: formData.tags,
                isPrivate: formData.isPrivate,
                avatar: avatarUrl || undefined,
                type: formData.type // 确保传递type字段
            });
        })
            .then(function (group) {
            wx.hideLoading();
            wx.showToast({
                title: '创建成功',
                icon: 'success'
            });
            // 返回上一页并刷新
            setTimeout(function () {
                // 返回并传递刷新标志
                var pages = getCurrentPages();
                var prevPage = pages[pages.length - 2];
                if (prevPage) {
                    // 调用上一页的刷新方法
                    prevPage.refreshData && prevPage.refreshData();
                }
                wx.navigateBack();
            }, 1500);
        })["catch"](function (error) {
            console.error('创建小组失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: (error === null || error === void 0 ? void 0 : error.message) || '创建失败',
                icon: 'none'
            });
        });
    },
    /**
     * 上传头像
     */
    uploadAvatar: function (filePath) {
        return new Promise(function (resolve, reject) {
            // 如果是临时文件路径，需要上传
            if (filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp')) {
                api_1.communityAPI.uploadImage(filePath)
                    .then(function (result) {
                    resolve(result.url);
                })["catch"](function (error) {
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
    validateForm: function () {
        var formData = this.data.formData;
        var isValid = true;
        var updates = {};
        // 验证名称
        if (!formData.name.trim()) {
            updates.nameError = '请输入小组名称';
            isValid = false;
        }
        else if (formData.name.length < 2) {
            updates.nameError = '名称至少需要2个字符';
            isValid = false;
        }
        else if (formData.name.length > 50) {
            updates.nameError = '名称最多50个字符';
            isValid = false;
        }
        else {
            updates.nameError = '';
        }
        // 验证描述
        if (!formData.description.trim()) {
            updates.descriptionError = '请输入小组描述';
            isValid = false;
        }
        else if (formData.description.length < 10) {
            updates.descriptionError = '描述至少需要10个字符';
            isValid = false;
        }
        else if (formData.description.length > 1000) {
            updates.descriptionError = '描述最多1000个字符';
            isValid = false;
        }
        else {
            updates.descriptionError = '';
        }
        // 更新表单状态
        updates.formValid = isValid;
        this.setData(updates);
        return isValid;
    }
});
