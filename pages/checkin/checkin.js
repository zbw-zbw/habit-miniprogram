"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("../../utils/date");
const api_1 = require("../../services/api");
const api_2 = require("../../services/api");
Page({
    data: {
        habitId: '',
        habitName: '',
        habit: null,
        showForm: false,
        formData: {
            duration: '00:30:00',
            content: '',
            note: '',
            mood: null,
            photos: []
        },
        timer: {
            isRunning: false,
            startTime: 0,
            elapsedTime: 0,
            displayTime: '00:00:00',
            intervalId: null
        },
        todayCheckins: [],
        weekDays: [],
        completedHabits: []
    },
    onLoad(options) {
        if (options.habitId) {
            this.setData({
                habitId: options.habitId,
                habitName: options.habitName || '习惯打卡'
            });
            wx.setNavigationBarTitle({
                title: options.habitName || '习惯打卡'
            });
            this.loadHabit();
            this.loadTodayCheckins();
            this.loadCompletedHabits();
            this.initWeekDays();
        }
        else {
            wx.showToast({
                title: '参数错误',
                icon: 'error'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },
    onUnload() {
        // 清除定时器
        if (this.data.timer.intervalId) {
            clearInterval(this.data.timer.intervalId);
        }
    },
    // 加载习惯详情
    async loadHabit() {
        try {
            wx.showLoading({ title: '加载中' });
            const habit = await api_1.habitAPI.getHabit(this.data.habitId);
            if (habit) {
                this.setData({
                    habit,
                    habitName: habit.name || this.data.habitName
                });
                // 更新导航栏标题
                wx.setNavigationBarTitle({
                    title: habit.name || '打卡'
                });
            }
            wx.hideLoading();
        }
        catch (error) {
            console.error('加载习惯失败:', error);
            // 创建一个默认的习惯对象，以防API调用失败
            const defaultHabit = {
                id: this.data.habitId,
                name: this.data.habitName || '习惯',
                description: '',
                category: '其他',
                icon: 'star',
                color: '#5E72E4',
                frequency: {
                    type: 'daily'
                },
                reminder: {
                    enabled: false,
                    time: '07:00'
                },
                isArchived: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                startDate: new Date().toISOString().split('T')[0]
            };
            this.setData({
                habit: defaultHabit,
                habitName: defaultHabit.name
            });
            wx.hideLoading();
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
        }
    },
    // 加载今日打卡记录
    async loadTodayCheckins() {
        try {
            const today = (0, date_1.formatDate)(new Date());
            const checkins = await api_1.checkinAPI.getCheckins({
                habitId: this.data.habitId,
                startDate: today,
                endDate: today
            });
            this.setData({
                todayCheckins: checkins
            });
        }
        catch (error) {
            console.error('加载今日打卡记录失败:', error);
            this.setData({
                todayCheckins: []
            });
        }
    },
    // 加载已完成的习惯
    async loadCompletedHabits() {
        try {
            const today = (0, date_1.formatDate)(new Date());
            const checkins = await api_1.checkinAPI.getCheckins({
                startDate: today,
                endDate: today
            });
            // 获取已完成打卡的习惯ID
            const completedHabitIds = checkins
                .filter(checkin => checkin.isCompleted)
                .map(checkin => checkin.habitId);
            // 如果有已完成的习惯，获取习惯详情
            if (completedHabitIds.length > 0) {
                const habits = await api_1.habitAPI.getHabits();
                const completedHabits = habits.filter(habit => completedHabitIds.includes(habit.id));
                this.setData({
                    completedHabits
                });
            }
            else {
                this.setData({
                    completedHabits: []
                });
            }
        }
        catch (error) {
            console.error('加载已完成习惯失败:', error);
            this.setData({
                completedHabits: []
            });
        }
    },
    // 初始化周视图
    initWeekDays() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0是周日，1是周一
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 调整到本周一
        const weekDays = [];
        const weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;
            weekDays.push({
                day: date.getDate(),
                weekday: weekdayNames[i],
                isToday,
                isCompleted: isPast && !isToday,
                isDisabled: date > today
            });
        }
        this.setData({
            weekDays
        });
    },
    // 切换打卡表单显示
    toggleForm() {
        this.setData({
            showForm: !this.data.showForm
        });
    },
    // 启动计时器
    startTimer() {
        if (this.data.timer.isRunning) {
            this.stopTimer();
            return;
        }
        const now = Date.now();
        const intervalId = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
        this.setData({
            'timer.isRunning': true,
            'timer.startTime': now - this.data.timer.elapsedTime,
            'timer.intervalId': intervalId
        });
    },
    // 停止计时器
    stopTimer() {
        if (this.data.timer.intervalId) {
            clearInterval(this.data.timer.intervalId);
        }
        this.setData({
            'timer.isRunning': false,
            'timer.intervalId': null
        });
    },
    // 重置计时器
    resetTimer() {
        this.stopTimer();
        this.setData({
            'timer.elapsedTime': 0,
            'timer.displayTime': '00:00:00'
        });
    },
    // 更新计时器显示
    updateTimerDisplay() {
        const now = Date.now();
        const elapsed = now - this.data.timer.startTime;
        // 格式化时间显示
        const totalSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.setData({
            'timer.elapsedTime': elapsed,
            'timer.displayTime': displayTime,
            'formData.duration': displayTime
        });
    },
    // 输入内容
    inputContent(e) {
        this.setData({
            'formData.content': e.detail.value
        });
    },
    // 输入笔记
    inputNote(e) {
        this.setData({
            'formData.note': e.detail.value
        });
    },
    // 选择心情
    selectMood(e) {
        const mood = e.currentTarget.dataset.mood;
        this.setData({
            'formData.mood': mood
        });
    },
    // 选择图片
    chooseImage() {
        wx.chooseImage({
            count: 9 - this.data.formData.photos.length,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const photos = [...this.data.formData.photos, ...res.tempFilePaths];
                this.setData({
                    'formData.photos': photos
                });
            }
        });
    },
    // 删除图片
    deleteImage(e) {
        const index = e.currentTarget.dataset.index;
        const photos = this.data.formData.photos;
        photos.splice(index, 1);
        this.setData({
            'formData.photos': photos
        });
    },
    // 查看每周进度
    viewWeeklyProgress() {
        wx.navigateTo({
            url: '/pages/analytics/analytics'
        });
    },
    // 提交打卡
    async submitCheckin() {
        const { formData, habitId } = this.data;
        // 表单验证
        if (formData.content.trim() === '') {
            wx.showToast({
                title: '请输入打卡内容',
                icon: 'none'
            });
            return;
        }
        try {
            wx.showLoading({
                title: '提交中'
            });
            // 如果有图片，先上传图片
            let photoUrls = [];
            if (formData.photos.length > 0) {
                wx.showLoading({
                    title: '上传图片中'
                });
                // 上传图片到服务器
                try {
                    photoUrls = await Promise.all(formData.photos.map(photo => api_2.communityAPI.uploadImage(photo)
                        .then(result => result.url)));
                }
                catch (error) {
                    console.error('上传图片失败:', error);
                    wx.hideLoading();
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none'
                    });
                    return;
                }
            }
            // 准备打卡数据
            const checkinData = {
                habitId,
                date: (0, date_1.formatDate)(new Date()),
                isCompleted: true,
                content: formData.content,
                note: formData.note,
                mood: formData.mood,
                duration: formData.duration,
                photos: photoUrls
            };
            // 调用API创建打卡记录
            await api_1.checkinAPI.createCheckin(checkinData);
            wx.hideLoading();
            wx.showToast({
                title: '打卡成功',
                icon: 'success'
            });
            // 重置表单
            this.setData({
                showForm: false,
                formData: {
                    duration: '00:30:00',
                    content: '',
                    note: '',
                    mood: null,
                    photos: []
                }
            });
            // 重新加载今日打卡记录
            this.loadTodayCheckins();
            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
        catch (error) {
            wx.hideLoading();
            wx.showToast({
                title: '打卡失败',
                icon: 'error'
            });
            console.error('提交打卡失败:', error);
        }
    },
});
