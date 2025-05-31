/**
 * 测试页面
 * 用于运行系统测试
 */
import { TestManager } from '../../utils/test-utils';

interface IPageData {
  testResults: string[];
  testing: boolean;
}

interface IPageMethods {
  runAllTests(): void;
  testAPIAvailability(): void;
  testDataFlow(): void;
  testOfflineFeatures(): void;
  testSyncManager(): void;
  clearTestResults(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    testResults: [],
    testing: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 重写console.log，将日志输出到页面上
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const that = this;
    
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      that.addTestResult(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    };
    
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      that.addTestResult('错误: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    };
  },

  /**
   * 添加测试结果
   */
  addTestResult(result: string) {
    const testResults = [...this.data.testResults, result];
    this.setData({ testResults });
  },

  /**
   * 运行所有测试
   */
  async runAllTests() {
    this.clearTestResults();
    this.setData({ testing: true });
    
    await TestManager.runAllTests();
    
    this.setData({ testing: false });
  },

  /**
   * 测试API服务可用性
   */
  async testAPIAvailability() {
    this.clearTestResults();
    this.setData({ testing: true });
    
    await TestManager.testAPIAvailability();
    
    this.setData({ testing: false });
  },

  /**
   * 测试数据流程
   */
  async testDataFlow() {
    this.clearTestResults();
    this.setData({ testing: true });
    
    await TestManager.testDataFlow();
    
    this.setData({ testing: false });
  },

  /**
   * 测试离线功能
   */
  testOfflineFeatures() {
    this.clearTestResults();
    this.setData({ testing: true });
    
    TestManager.testOfflineFeatures();
    
    this.setData({ testing: false });
  },

  /**
   * 测试同步管理器
   */
  testSyncManager() {
    this.clearTestResults();
    this.setData({ testing: true });
    
    TestManager.testSyncManager();
    
    setTimeout(() => {
      this.setData({ testing: false });
    }, 3000);
  },

  /**
   * 清空测试结果
   */
  clearTestResults() {
    this.setData({ testResults: [] });
  }
}); 
