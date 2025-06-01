// 关于我们页面
Page({
    data: {
        version: '1.0.0',
        year: new Date().getFullYear() // 当前年份
    },
    onLoad() {
        // 页面加载时执行
    },
    // 复制邮箱
    copyEmail() {
        wx.setClipboardData({
            data: 'support@habittracker.com',
            success: () => {
                wx.showToast({
                    title: '邮箱已复制',
                    icon: 'success'
                });
            }
        });
    },
    // 复制微信号
    copyWechat() {
        wx.setClipboardData({
            data: 'habittracker',
            success: () => {
                wx.showToast({
                    title: '微信号已复制',
                    icon: 'success'
                });
            }
        });
    },
    // 访问网站
    openWebsite() {
        // 在小程序中不能直接跳转外部链接，可以复制链接或提示用户
        wx.setClipboardData({
            data: 'www.habittracker.com',
            success: () => {
                wx.showToast({
                    title: '网址已复制',
                    icon: 'success'
                });
            }
        });
    },
    // 显示用户协议
    showAgreement() {
        wx.navigateTo({
            url: '/pages/profile/agreement/agreement'
        });
    },
    // 显示隐私政策
    showPrivacy() {
        wx.navigateTo({
            url: '/pages/profile/privacy/privacy'
        });
    },
    // 分享
    onShareAppMessage() {
        return {
            title: '习惯打卡 - 让习惯培养更简单',
            path: '/pages/index/index',
            imageUrl: '/assets/images/share.png'
        };
    }
});
