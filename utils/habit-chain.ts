/**
 * 习惯链分析与设计工具
 * 用于分析用户习惯之间的关联，以及设计和推荐习惯链
 */

import { formatDate } from './date';

// 习惯关联类型
export enum HabitRelationType {
  TRIGGER = 'trigger', // 一个习惯触发另一个习惯
  SEQUENTIAL = 'sequential', // 习惯按顺序执行
  COMPLEMENTARY = 'complementary', // 互补习惯，相互促进
  CONFLICTING = 'conflicting', // 冲突习惯，相互抑制
}

// 习惯关联强度
export enum RelationStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

// 习惯关联
export interface HabitRelation {
  sourceHabitId: string;
  targetHabitId: string;
  type: HabitRelationType;
  strength: RelationStrength;
  confidence: number; // 0-1之间的数字，表示置信度
  description?: string;
}

// 习惯链
export interface HabitChain {
  id: string;
  name: string;
  description?: string;
  habits: Array<{
    habitId: string;
    order: number;
    isOptional: boolean;
  }>;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    days?: number[]; // 对于自定义频率，指定星期几
  };
  createdAt: string;
  updatedAt?: string;
}

/**
 * 分析两个习惯之间的关联
 * @param sourceHabit 源习惯
 * @param targetHabit 目标习惯
 * @param checkins 打卡记录
 */
export function analyzeHabitRelation(
  sourceHabit: IHabit,
  targetHabit: IHabit,
  checkins: ICheckin[]
): HabitRelation {
  // 按习惯ID分组打卡记录
  const sourceCheckins = checkins.filter(c => c.habitId === sourceHabit.id && c.isCompleted);
  const targetCheckins = checkins.filter(c => c.habitId === targetHabit.id && c.isCompleted);
  
  // 如果打卡记录太少，则认为关联很弱
  if (sourceCheckins.length < 5 || targetCheckins.length < 5) {
    return {
      sourceHabitId: sourceHabit.id,
      targetHabitId: targetHabit.id,
      type: HabitRelationType.SEQUENTIAL,
      strength: RelationStrength.WEAK,
      confidence: 0.3,
      description: '数据不足，无法确定明确关联'
    };
  }
  
  // 分析时间关系
  const timeRelation = analyzeTimeRelation(sourceCheckins, targetCheckins);
  
  // 分析共现关系
  const cooccurrenceRelation = analyzeCooccurrence(sourceCheckins, targetCheckins);
  
  // 根据分析结果确定关联类型和强度
  let type = HabitRelationType.SEQUENTIAL;
  let strength = RelationStrength.MEDIUM;
  let confidence = 0.5;
  let description = '';
  
  // 如果目标习惯通常在源习惯之后不久完成，可能是触发关系
  if (timeRelation.averageTimeDiff > 0 && timeRelation.averageTimeDiff < 3600000) { // 1小时内
    type = HabitRelationType.TRIGGER;
    strength = RelationStrength.STRONG;
    confidence = Math.min(0.9, timeRelation.consistency);
    description = `${sourceHabit.name}通常会在${timeRelation.averageTimeDiff / 60000}分钟内触发${targetHabit.name}`;
  } 
  // 如果两个习惯经常在同一天完成，但时间差较大，可能是顺序关系
  else if (cooccurrenceRelation.sameDay > 0.7) { // 70%以上的同日完成率
    type = HabitRelationType.SEQUENTIAL;
    strength = RelationStrength.MEDIUM;
    confidence = cooccurrenceRelation.sameDay;
    description = `${sourceHabit.name}和${targetHabit.name}经常在同一天完成，可能有顺序关系`;
  }
  // 如果两个习惯完成日期互相关联但不固定先后，可能是互补关系
  else if (cooccurrenceRelation.correlation > 0.5) { // 50%以上的相关性
    type = HabitRelationType.COMPLEMENTARY;
    strength = RelationStrength.MEDIUM;
    confidence = cooccurrenceRelation.correlation;
    description = `${sourceHabit.name}和${targetHabit.name}相互促进，形成互补关系`;
  }
  // 如果一个习惯完成时另一个习惯通常不完成，可能是冲突关系
  else if (cooccurrenceRelation.correlation < -0.3) { // -30%以下的相关性
    type = HabitRelationType.CONFLICTING;
    strength = RelationStrength.MEDIUM;
    confidence = Math.abs(cooccurrenceRelation.correlation);
    description = `${sourceHabit.name}和${targetHabit.name}可能存在冲突，很少同时完成`;
  }
  // 其他情况，关系较弱
  else {
    type = HabitRelationType.SEQUENTIAL;
    strength = RelationStrength.WEAK;
    confidence = 0.4;
    description = `${sourceHabit.name}和${targetHabit.name}之间关系不明显`;
  }
  
  return {
    sourceHabitId: sourceHabit.id,
    targetHabitId: targetHabit.id,
    type,
    strength,
    confidence,
    description
  };
}

/**
 * 分析两个习惯的打卡时间关系
 */
function analyzeTimeRelation(
  sourceCheckins: ICheckin[], 
  targetCheckins: ICheckin[]
) {
  // 找出同一天的打卡记录
  const sameDayCheckins: Array<{source: ICheckin, target: ICheckin}> = [];
  
  sourceCheckins.forEach(sourceCheckin => {
    const targetOnSameDay = targetCheckins.find(tc => tc.date === sourceCheckin.date);
    if (targetOnSameDay) {
      sameDayCheckins.push({
        source: sourceCheckin,
        target: targetOnSameDay
      });
    }
  });
  
  if (sameDayCheckins.length === 0) {
    return {
      averageTimeDiff: 0,
      consistency: 0
    };
  }
  
  // 计算时间差
  const timeDiffs: number[] = sameDayCheckins.map(pair => {
    const sourceTime = new Date(pair.source.createdAt).getTime();
    const targetTime = new Date(pair.target.createdAt).getTime();
    return targetTime - sourceTime;
  });
  
  // 计算平均时间差
  const totalTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0);
  const averageTimeDiff = totalTimeDiff / timeDiffs.length;
  
  // 计算一致性（标准差的反比）
  const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - averageTimeDiff, 2), 0) / timeDiffs.length;
  const stdDev = Math.sqrt(variance);
  
  // 一致性 = 1 / (1 + 标准差 / 平均值的绝对值)
  const consistency = stdDev === 0 ? 1 : 1 / (1 + (stdDev / Math.abs(averageTimeDiff)));
  
  return {
    averageTimeDiff,
    consistency
  };
}

/**
 * 分析两个习惯的共现关系
 */
function analyzeCooccurrence(
  sourceCheckins: ICheckin[], 
  targetCheckins: ICheckin[]
) {
  // 所有不重复的日期
  const allDates = Array.from(new Set([
    ...sourceCheckins.map(c => c.date),
    ...targetCheckins.map(c => c.date)
  ]));
  
  // 统计每个日期两个习惯的完成情况
  const dailyCompletions = allDates.map(date => {
    const sourceCompleted = sourceCheckins.some(c => c.date === date);
    const targetCompleted = targetCheckins.some(c => c.date === date);
    return { date, sourceCompleted, targetCompleted };
  });
  
  // 计算同日完成率
  const sameDayCount = dailyCompletions.filter(d => d.sourceCompleted && d.targetCompleted).length;
  const sameDay = sameDayCount / allDates.length;
  
  // 计算相关性（-1到1之间）
  let correlation = 0;
  
  // 使用phi相关系数计算二元变量的相关性
  const a = sameDayCount; // 两个习惯都完成
  const b = dailyCompletions.filter(d => d.sourceCompleted && !d.targetCompleted).length; // 只有源习惯完成
  const c = dailyCompletions.filter(d => !d.sourceCompleted && d.targetCompleted).length; // 只有目标习惯完成
  const d = dailyCompletions.filter(d => !d.sourceCompleted && !d.targetCompleted).length; // 两个习惯都未完成
  
  const numerator = a * d - b * c;
  const denominator = Math.sqrt((a + b) * (c + d) * (a + c) * (b + d));
  
  if (denominator !== 0) {
    correlation = numerator / denominator;
  }
  
  return {
    sameDay,
    correlation
  };
}

/**
 * 根据习惯关联自动生成习惯链
 * @param habits 用户的所有习惯
 * @param relations 习惯之间的关联
 */
export function generateHabitChains(
  habits: IHabit[],
  relations: HabitRelation[]
): HabitChain[] {
  const chains: HabitChain[] = [];
  
  // 按关联强度降序排序
  const sortedRelations = [...relations].sort((a, b) => {
    const strengthOrder = { [RelationStrength.STRONG]: 3, [RelationStrength.MEDIUM]: 2, [RelationStrength.WEAK]: 1 };
    return (strengthOrder[b.strength] * b.confidence) - (strengthOrder[a.strength] * a.confidence);
  });
  
  // 查找触发型关系形成的链
  const triggerChains = findTriggerChains(habits, sortedRelations);
  chains.push(...triggerChains);
  
  // 查找互补型关系形成的组合
  const complementaryChains = findComplementaryChains(habits, sortedRelations);
  chains.push(...complementaryChains);
  
  return chains;
}

/**
 * 查找触发型习惯链
 */
function findTriggerChains(
  habits: IHabit[],
  relations: HabitRelation[]
): HabitChain[] {
  const chains: HabitChain[] = [];
  
  // 找出所有触发关系
  const triggerRelations = relations.filter(r => 
    r.type === HabitRelationType.TRIGGER && 
    r.strength !== RelationStrength.WEAK &&
    r.confidence > 0.5
  );
  
  // 构建习惯图
  const habitGraph = buildHabitGraph(habits, triggerRelations);
  
  // 查找所有路径
  const visited = new Set<string>();
  const usedHabits = new Set<string>();
  
  habits.forEach(habit => {
    if (!visited.has(habit.id)) {
      const path: string[] = [];
      findPaths(habit.id, habitGraph, visited, path, chains, habits, usedHabits);
    }
  });
  
  return chains;
}

/**
 * 构建习惯关系图
 */
function buildHabitGraph(
  habits: IHabit[],
  relations: HabitRelation[]
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  // 初始化所有习惯节点
  habits.forEach(habit => {
    graph.set(habit.id, []);
  });
  
  // 添加关系边
  relations.forEach(relation => {
    const neighbors = graph.get(relation.sourceHabitId) || [];
    neighbors.push(relation.targetHabitId);
    graph.set(relation.sourceHabitId, neighbors);
  });
  
  return graph;
}

/**
 * 深度优先搜索查找习惯路径
 */
function findPaths(
  habitId: string,
  graph: Map<string, string[]>,
  visited: Set<string>,
  path: string[],
  chains: HabitChain[],
  habits: IHabit[],
  usedHabits: Set<string>
) {
  visited.add(habitId);
  path.push(habitId);
  
  // 当路径长度大于等于3时，创建一个习惯链
  if (path.length >= 3 && !isSubsetOfExistingChain(path, chains)) {
    const chainHabits = path.map(id => habits.find(h => h.id === id));
    const validHabits = chainHabits.filter(Boolean) as IHabit[];
    
    if (validHabits.length === path.length) {
      const chain: HabitChain = {
        id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${validHabits[0].name}链`,
        description: `从${validHabits[0].name}开始的${validHabits.length}个习惯链`,
        habits: validHabits.map((habit, index) => ({
          habitId: habit.id,
          order: index + 1,
          isOptional: index > 0 && index < validHabits.length - 1 && Math.random() > 0.7
        })),
        frequency: {
          type: 'daily'
        },
        createdAt: new Date().toISOString()
      };
      
      chains.push(chain);
      path.forEach(id => usedHabits.add(id));
    }
  }
  
  // 继续搜索相邻节点
  const neighbors = graph.get(habitId) || [];
  for (const neighbor of neighbors) {
    if (!path.includes(neighbor)) {
      findPaths(neighbor, graph, visited, [...path], chains, habits, usedHabits);
    }
  }
}

/**
 * 查找是否已经是现有链的子集
 */
function isSubsetOfExistingChain(path: string[], chains: HabitChain[]): boolean {
  return chains.some(chain => {
    const chainHabitIds = chain.habits.map(h => h.habitId);
    return path.every(id => chainHabitIds.includes(id));
  });
}

/**
 * 查找互补型习惯链
 */
function findComplementaryChains(
  habits: IHabit[],
  relations: HabitRelation[]
): HabitChain[] {
  const chains: HabitChain[] = [];
  
  // 找出所有互补关系
  const complementaryRelations = relations.filter(r => 
    r.type === HabitRelationType.COMPLEMENTARY && 
    r.strength !== RelationStrength.WEAK &&
    r.confidence > 0.5
  );
  
  // 按照源习惯分组
  const habitGroups = new Map<string, string[]>();
  
  complementaryRelations.forEach(relation => {
    const sourceId = relation.sourceHabitId;
    const targetId = relation.targetHabitId;
    
    if (!habitGroups.has(sourceId)) {
      habitGroups.set(sourceId, []);
    }
    
    const group = habitGroups.get(sourceId) as string[];
    if (!group.includes(targetId)) {
      group.push(targetId);
    }
  });
  
  // 为每个有足够互补习惯的习惯创建链
  habitGroups.forEach((relatedHabits, habitId) => {
    if (relatedHabits.length >= 2) {
      const sourceHabit = habits.find(h => h.id === habitId);
      
      if (sourceHabit) {
        // 查找所有相关习惯
        const chainHabits = [sourceHabit];
        relatedHabits.forEach(id => {
          const habit = habits.find(h => h.id === id);
          if (habit) {
            chainHabits.push(habit);
          }
        });
        
        if (chainHabits.length >= 3) {
          const chain: HabitChain = {
            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${sourceHabit.name}组合`,
            description: `以${sourceHabit.name}为核心的互补习惯组合`,
            habits: chainHabits.map((habit, index) => ({
              habitId: habit.id,
              order: index + 1,
              isOptional: index > 0
            })),
            frequency: {
              type: 'daily'
            },
            createdAt: new Date().toISOString()
          };
          
          chains.push(chain);
        }
      }
    }
  });
  
  return chains;
}

/**
 * 为用户推荐习惯链
 * @param habits 用户当前的习惯
 * @param checkins 用户的打卡记录
 */
export async function recommendHabitChains(
  habits: IHabit[],
  checkins: ICheckin[]
): Promise<HabitChain[]> {
  // 分析所有习惯间的关系
  const relations: HabitRelation[] = [];
  
  for (let i = 0; i < habits.length; i++) {
    for (let j = 0; j < habits.length; j++) {
      if (i !== j) {
        const relation = analyzeHabitRelation(habits[i], habits[j], checkins);
        relations.push(relation);
      }
    }
  }
  
  // 生成习惯链
  const chains = generateHabitChains(habits, relations);
  
  // 按照习惯数量和关系强度对链进行排序
  return chains.sort((a, b) => {
    // 优先考虑习惯数量
    const habitCountDiff = b.habits.length - a.habits.length;
    if (habitCountDiff !== 0) {
      return habitCountDiff;
    }
    
    // 习惯数相同时，比较创建时间（新的优先）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
} 
