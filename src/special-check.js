/**
 * 特殊人格检测模块
 * 基于原始分数进行极端倾向检测
 */

const DIM_KEYS = ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15']

function dimIndex(key) {
  return DIM_KEYS.indexOf(key)
}

/**
 * 检测是否触发特殊人格
 * @param {number[]} rawScores - 原始累加分数（-30~60 范围）
 * @param {number[]} normalizedScores - 归一化后分数（0~10）
 * @param {number[]} userLevels - L/M/H 等级
 * @param {object[]} specialTypes - 特殊人格列表
 * @param {object} config - 配置
 * @returns {object|null} 匹配的特殊人格，或 null
 */
export function checkSpecialPersonality(rawScores, normalizedScores, userLevels, specialTypes, config) {
  const threshold = config.specialCheck?.extremeThreshold ?? 8

  // S01: 天道漏洞·观察者 — 所有维度高度均衡
  const mean = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length
  const variance = normalizedScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / normalizedScores.length
  const stdDev = Math.sqrt(variance)

  const allLow = normalizedScores.every(s => s <= threshold - 2 && s >= 2)
  if (stdDev < 2.5 && allLow) {
    const observer = specialTypes.find(t => t.id === 'S01')
    if (observer) return observer
  }

  // S02: 心魔·暗面 — 极恶极欲
  const d10 = rawScores[dimIndex('D10')]  // 善恶观
  const d12 = rawScores[dimIndex('D12')]  // 欲望
  const d13 = rawScores[dimIndex('D13')]  // 力量观
  if (d10 <= -8 && d12 >= 9 && d13 <= 2) {
    const dark = specialTypes.find(t => t.id === 'S02')
    if (dark) return dark
  }

  // S03: 坐忘道·虚无 — 自我迷失 + 心性混沌
  const d14 = rawScores[dimIndex('D14')]  // 自我认知
  const d03 = rawScores[dimIndex('D03')]  // 心性
  if (d14 >= -6 && d14 <= -2 && d03 >= -2 && d03 <= 2) {
    const xu = specialTypes.find(t => t.id === 'S03')
    if (xu) return xu
  }

  // S04: 远古大能·重生者 — 高谋略高意志低胆识
  const d06 = rawScores[dimIndex('D06')]  // 谋略
  const d08 = rawScores[dimIndex('D08')]  // 魄力
  const d05 = rawScores[dimIndex('D05')]  // 意志
  const d01 = rawScores[dimIndex('D01')]  // 胆识
  if (d06 >= 10 && d08 >= 7 && d05 >= 8 && d01 <= 4) {
    const reborn = specialTypes.find(t => t.id === 'S04')
    if (reborn) return reborn
  }

  // S05: 殉道者·燃灯 — 高守护 + 高气度 + 终极追求偏轰轰烈烈
  const d09 = rawScores[dimIndex('D09')]  // 守护心
  const d15 = rawScores[dimIndex('D15')]  // 终极追求
  const d04 = rawScores[dimIndex('D04')]  // 气度
  if (d09 >= 10 && d15 <= 2 && d04 >= 8) {
    const martyr = specialTypes.find(t => t.id === 'S05')
    if (martyr) return martyr
  }

  return null
}
