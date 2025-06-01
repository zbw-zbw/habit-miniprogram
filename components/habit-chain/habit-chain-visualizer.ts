/**
 * 习惯链可视化组件
 * 用于图形化展示习惯链，支持交互式编辑
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    chain: {
      type: Object,
      value: null,
      observer: 'onChainChanged'
    },
    habits: {
      type: Array,
      value: [],
      observer: 'onHabitsChanged'
    },
    editable: {
      type: Boolean,
      value: false
    },
    theme: {
      type: String,
      value: 'light'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    nodes: [] as Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
      x: number;
      y: number;
      radius: number;
      isOptional: boolean;
    }>,
    edges: [] as Array<{
      source: string;
      target: string;
      color: string;
      width: number;
    }>,
    canvasWidth: 300,
    canvasHeight: 300,
    ctx: null as CanvasRenderingContext2D | null,
    touchStartX: 0,
    touchStartY: 0,
    isDragging: false,
    draggedNodeIndex: -1,
    hasRendered: false,
    isInitialized: false
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      this.initCanvas();
    },
    ready() {
      this.updateCanvasSize();
      this.prepareData();
      this.render();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化画布
     */
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#chain-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置画布分辨率
            const dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);
            
            this.setData({ 
              ctx,
              canvasWidth: res[0].width,
              canvasHeight: res[0].height,
              isInitialized: true
            }, () => {
              this.prepareData();
              this.render();
            });
          }
        });
    },

    /**
     * 更新画布大小
     */
    updateCanvasSize() {
      const query = this.createSelectorQuery();
      query.select('#canvas-container')
        .boundingClientRect()
        .exec((res) => {
          if (res[0]) {
            const width = res[0].width;
            const height = res[0].height || 300; // 默认高度
            
            this.setData({
              canvasWidth: width,
              canvasHeight: height
            });
            
            if (this.data.isInitialized) {
              this.prepareData();
              this.render();
            }
          }
        });
    },

    /**
     * 处理习惯链数据变化
     */
    onChainChanged(newVal: any) {
      if (newVal) {
        this.prepareData();
        this.render();
      }
    },

    /**
     * 处理习惯列表变化
     */
    onHabitsChanged() {
      this.prepareData();
      this.render();
    },

    /**
     * 准备可视化数据
     */
    prepareData() {
      const { chain, habits, canvasWidth, canvasHeight } = this.data;
      if (!chain || !habits || habits.length === 0) return;
      
      const nodes: any[] = [];
      const edges: any[] = [];
      
      // 计算节点布局
      const chainHabits = chain.habits.sort((a: any, b: any) => a.order - b.order);
      const nodeCount = chainHabits.length;
      const radius = 30;
      const padding = 60;
      
      // 根据链中的习惯数量确定布局方式
      let layoutFn;
      
      if (nodeCount <= 3) {
        // 线性布局
        layoutFn = (index: number) => {
          const spacing = (canvasWidth - 2 * padding - 2 * radius) / Math.max(1, nodeCount - 1);
          return {
            x: padding + radius + index * spacing,
            y: canvasHeight / 2
          };
        };
      } else if (nodeCount <= 6) {
        // 圆形布局
        layoutFn = (index: number) => {
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          const layoutRadius = Math.min(canvasWidth, canvasHeight) / 2 - padding;
          const angle = (index / nodeCount) * 2 * Math.PI;
          
          return {
            x: centerX + layoutRadius * Math.cos(angle),
            y: centerY + layoutRadius * Math.sin(angle)
          };
        };
      } else {
        // 力导向布局（简化版）
        const rows = Math.ceil(Math.sqrt(nodeCount));
        const cols = Math.ceil(nodeCount / rows);
        const gridWidth = (canvasWidth - 2 * padding) / cols;
        const gridHeight = (canvasHeight - 2 * padding) / rows;
        
        layoutFn = (index: number) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          
          return {
            x: padding + radius + col * gridWidth,
            y: padding + radius + row * gridHeight
          };
        };
      }
      
      // 创建节点
      chainHabits.forEach((item: any, index: number) => {
        const habitInfo = habits.find((h: any) => h.id === item.habitId);
        if (!habitInfo) return;
        
        const { x, y } = layoutFn(index);
        
        nodes.push({
          id: habitInfo.id,
          name: habitInfo.name,
          color: habitInfo.color || '#5E72E4',
          icon: habitInfo.icon || 'star',
          x,
          y,
          radius,
          isOptional: item.isOptional
        });
      });
      
      // 创建边
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          color: nodes[i + 1].isOptional ? '#AAAAAA' : '#5E72E4',
          width: nodes[i + 1].isOptional ? 1 : 2
        });
      }
      
      this.setData({ nodes, edges });
    },

    /**
     * 渲染可视化图
     */
    render() {
      const { ctx, nodes, edges, canvasWidth, canvasHeight, theme } = this.data;
      
      if (!ctx || nodes.length === 0) return;
      
      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 设置背景
      ctx.fillStyle = theme === 'dark' ? '#1A1A1A' : '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制边
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = edge.color;
          ctx.lineWidth = edge.width;
          
          // 虚线表示可选
          if (target.isOptional) {
            ctx.setLineDash([5, 3]);
          } else {
            ctx.setLineDash([]);
          }
          
          ctx.stroke();
          ctx.setLineDash([]);
          
          // 绘制箭头
          this.drawArrow(ctx, source.x, source.y, target.x, target.y, edge.color);
        }
      });
      
      // 绘制节点
      nodes.forEach(node => {
        // 节点圆形背景
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // 可选节点的虚线边框
        if (node.isOptional) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#888888';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // 节点名称
        ctx.fillStyle = this.getContrastColor(node.color);
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 截断长名称
        let displayName = node.name;
        if (displayName.length > 5) {
          displayName = displayName.substring(0, 4) + '..';
        }
        
        ctx.fillText(displayName, node.x, node.y);
      });
      
      this.setData({ hasRendered: true });
    },

    /**
     * 绘制箭头
     */
    drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
      const headLength = 10; // 箭头长度
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      // 调整箭头位置到目标节点边缘
      const radius = this.data.nodes[0].radius;
      const targetX = toX - radius * Math.cos(angle);
      const targetY = toY - radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX - headLength * Math.cos(angle - Math.PI / 6),
        targetY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX - headLength * Math.cos(angle + Math.PI / 6),
        targetY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    /**
     * 获取对比色（为确保文本可读性）
     */
    getContrastColor(hexColor: string): string {
      // 移除#前缀
      hexColor = hexColor.replace('#', '');
      
      // 解析RGB
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      // 计算亮度 (以YIQ格式) - 参见 http://www.w3.org/TR/AERT#color-contrast
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      
      return (yiq >= 128) ? '#000000' : '#FFFFFF';
    },

    /**
     * 触摸开始事件
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.editable) return;
      
      const touch = e.touches[0];
      const { nodes } = this.data;
      
      this.setData({
        touchStartX: touch.x,
        touchStartY: touch.y,
        isDragging: false,
        draggedNodeIndex: -1
      });
      
      // 检查是否点击到节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dx = node.x - touch.x;
        const dy = node.y - touch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= node.radius) {
          this.setData({
            isDragging: true,
            draggedNodeIndex: i
          });
          break;
        }
      }
    },

    /**
     * 触摸移动事件
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.editable || !this.data.isDragging || this.data.draggedNodeIndex === -1) return;
      
      const touch = e.touches[0];
      const { draggedNodeIndex, nodes } = this.data;
      
      const newNodes = [...nodes];
      newNodes[draggedNodeIndex].x = touch.x;
      newNodes[draggedNodeIndex].y = touch.y;
      
      this.setData({ nodes: newNodes });
      this.render();
    },

    /**
     * 触摸结束事件
     */
    onTouchEnd() {
      this.setData({
        isDragging: false,
        draggedNodeIndex: -1
      });
      
      // 通知外部节点位置已更新
      if (this.data.editable) {
        this.triggerEvent('layoutChanged', { nodes: this.data.nodes });
      }
    },

    /**
     * 点击节点事件
     */
    onNodeClick(e: WechatMiniprogram.TouchEvent) {
      const touch = e.changedTouches[0];
      const { nodes } = this.data;
      
      // 检查是否点击到节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dx = node.x - touch.x;
        const dy = node.y - touch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= node.radius) {
          this.triggerEvent('nodeClick', { habitId: node.id, index: i });
          break;
        }
      }
    },

    /**
     * 切换节点的可选状态
     */
    toggleOptional(habitId: string) {
      if (!this.data.editable) return;
      
      const { nodes, edges, chain } = this.data;
      const nodeIndex = nodes.findIndex(n => n.id === habitId);
      
      if (nodeIndex === -1 || nodeIndex === 0) return; // 第一个节点不能设为可选
      
      // 更新节点状态
      const newNodes = [...nodes];
      newNodes[nodeIndex].isOptional = !newNodes[nodeIndex].isOptional;
      
      // 更新边状态
      const newEdges = [...edges];
      const edgeIndex = newEdges.findIndex(e => e.target === habitId);
      if (edgeIndex !== -1) {
        newEdges[edgeIndex].color = newNodes[nodeIndex].isOptional ? '#AAAAAA' : '#5E72E4';
        newEdges[edgeIndex].width = newNodes[nodeIndex].isOptional ? 1 : 2;
      }
      
      // 更新链数据
      const newChain = { ...chain };
      const habitIndex = newChain.habits.findIndex((h: any) => h.habitId === habitId);
      if (habitIndex !== -1) {
        newChain.habits[habitIndex].isOptional = newNodes[nodeIndex].isOptional;
      }
      
      this.setData({
        nodes: newNodes,
        edges: newEdges,
        chain: newChain
      });
      
      this.triggerEvent('optionalChanged', { 
        habitId, 
        isOptional: newNodes[nodeIndex].isOptional,
        chain: newChain
      });
      
      this.render();
    },

    /**
     * 更改节点顺序
     */
    changeNodeOrder(habitId: string, newOrder: number) {
      if (!this.data.editable) return;
      
      const { chain } = this.data;
      const newChain = { ...chain };
      
      // 查找当前习惯的索引
      const habitIndex = newChain.habits.findIndex((h: any) => h.habitId === habitId);
      if (habitIndex === -1) return;
      
      const currentOrder = newChain.habits[habitIndex].order;
      
      // 更新所有受影响的习惯顺序
      newChain.habits.forEach((h: any, i: number) => {
        if (h.habitId === habitId) {
          h.order = newOrder;
        } else if (
          (newOrder > currentOrder && h.order > currentOrder && h.order <= newOrder) ||
          (newOrder < currentOrder && h.order < currentOrder && h.order >= newOrder)
        ) {
          h.order += newOrder > currentOrder ? -1 : 1;
        }
      });
      
      this.setData({ chain: newChain });
      this.prepareData();
      this.render();
      
      this.triggerEvent('orderChanged', { chain: newChain });
    }
  }
}); 
