// 习惯选择页面
import { habitAPI } from '../../../services/api';

interface IHabitTemplate {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category: string;
  selected?: boolean;
}

Page({
  data: {
    searchKey: '',
    loading: true,
    currentCategory: 0,
    categories: [
      { code: 'all', name: '全部' },
      { code: 'health', name: '健康' },
      { code: 'learning', name: '学习' },
      { code: 'work', name: '工作' },
      { code: 'life', name: '生活' },
      { code: 'other', name: '其他' }
    ],
    habitTemplates: [] as IHabitTemplate[],
    filteredHabits: [] as IHabitTemplate[],
    selectedHabits: [] as IHabitTemplate[]
  },

  onLoad() {
    // 获取推荐习惯模板
    this.fetchHabitTemplates();
  },

  // 获取习惯模板数据
  fetchHabitTemplates() {
    this.setData({ loading: true });

    // 模拟数据，实际项目中应替换为API调用
    setTimeout(() => {
      const templates: IHabitTemplate[] = [
        {
          id: '1',
          name: '每日喝水',
          description: '每天喝够8杯水',
          icon: 'icon-water',
          color: '#4F7CFF',
          category: 'health'
        },
        {
          id: '2',
          name: '晨间阅读',
          description: '每天早上阅读30分钟',
          icon: 'icon-book',
          color: '#FF9F43',
          category: 'learning'
        },
        {
          id: '3',
          name: '每日运动',
          description: '每天运动30分钟',
          icon: 'icon-exercise',
          color: '#FF6B6B',
          category: 'health'
        },
        {
          id: '4',
          name: '写日记',
          description: '记录每一天的成长',
          icon: 'icon-diary',
          color: '#2ED573',
          category: 'life'
        },
        {
          id: '5',
          name: '冥想',
          description: '每天冥想10分钟',
          icon: 'icon-meditation',
          color: '#A367DC',
          category: 'health'
        },
        {
          id: '6',
          name: '学习编程',
          description: '每天学习编程1小时',
          icon: 'icon-code',
          color: '#1E90FF',
          category: 'learning'
        },
        {
          id: '7',
          name: '整理工作区',
          description: '保持工作区整洁',
          icon: 'icon-clean',
          color: '#20BDFF',
          category: 'work'
        },
        {
          id: '8',
          name: '早睡早起',
          description: '每天按时睡觉，早起',
          icon: 'icon-sleep',
          color: '#6C5CE7',
          category: 'health'
        },
        {
          id: '9',
          name: '感恩日记',
          description: '记录生活中值得感恩的事情',
          icon: 'icon-thank',
          color: '#FF7675',
          category: 'life'
        }
      ];

      this.setData({
        habitTemplates: templates,
        loading: false
      }, () => {
        this.filterHabits();
      });
    }, 800);
  },

  // 根据搜索关键词和分类筛选习惯
  filterHabits() {
    const { searchKey, currentCategory, categories, habitTemplates } = this.data;
    
    // 筛选逻辑
    let filtered = [...habitTemplates];
    
    // 按分类筛选
    if (currentCategory > 0) {
      const category = categories[currentCategory].code;
      filtered = filtered.filter(item => item.category === category);
    }
    
    // 按关键词搜索
    if (searchKey) {
      const key = searchKey.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(key) || 
        (item.description && item.description.toLowerCase().includes(key))
      );
    }
    
    this.setData({ filteredHabits: filtered });
  },

  // 切换分类
  switchCategory(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentCategory: index }, () => {
      this.filterHabits();
    });
  },

  // 搜索输入
  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKey: e.detail.value }, () => {
      this.filterHabits();
    });
  },

  // 清除搜索
  clearSearch() {
    this.setData({ searchKey: '' }, () => {
      this.filterHabits();
    });
  },

  // 切换选择习惯
  toggleHabit(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const { filteredHabits, selectedHabits } = this.data;
    const habit = filteredHabits[index];
    
    // 更新选中状态
    habit.selected = !habit.selected;
    
    // 更新选中列表
    let newSelectedHabits = [...selectedHabits];
    if (habit.selected) {
      newSelectedHabits.push(habit);
    } else {
      newSelectedHabits = newSelectedHabits.filter(item => item.id !== habit.id);
    }
    
    this.setData({
      filteredHabits: [...filteredHabits], // 创建新数组触发视图更新
      selectedHabits: newSelectedHabits
    });
  },

  // 创建自定义习惯
  createCustomHabit() {
    wx.navigateTo({
      url: '/pages/habits/create/create'
    });
  },

  // 确认选择
  confirmSelection() {
    const { selectedHabits } = this.data;
    
    if (selectedHabits.length === 0) {
      return;
    }
    
    // 获取页面栈
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; // 上一个页面
    
    // 将选中的习惯传递给上一个页面
    if (prevPage) {
      prevPage.setData({
        selectedTemplates: selectedHabits
      });
      
      // 如果上一个页面有接收选择习惯的方法，调用它
      if (typeof prevPage.onHabitsSelected === 'function') {
        prevPage.onHabitsSelected(selectedHabits);
      }
    }
    
    // 返回上一页
    wx.navigateBack();
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '选择你想要培养的习惯',
      path: '/pages/index/index'
    };
  }
}); 
