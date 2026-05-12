import { checkSpecialPersonality } from './special-check.js'

const DIM_COUNT = 15
const DIM_KEYS = ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15']

/**
 * 加权向量累加计分
 * 每题选项：primary +2, secondary +1, suppress -1, suppress2 -1
 */
export function calcDimensionScores(answers, questions) {
  const scores = Array(DIM_COUNT).fill(0)
  for (const q of questions) {
    const ans = answers[q.id]
    if (ans == null) continue
    const opt = q.options[ans]
    if (!opt) continue

    const pIdx = DIM_KEYS.indexOf(opt.primary)
    if (pIdx >= 0) scores[pIdx] += 2

    if (opt.secondary) {
      const sIdx = DIM_KEYS.indexOf(opt.secondary)
      if (sIdx >= 0) scores[sIdx] += 1
    }

    if (opt.suppress) {
      const supIdx = DIM_KEYS.indexOf(opt.suppress)
      if (supIdx >= 0) scores[supIdx] -= 1
    }

    if (opt.suppress2) {
      const sup2Idx = DIM_KEYS.indexOf(opt.suppress2)
      if (sup2Idx >= 0) scores[sup2Idx] -= 1
    }
  }
  return scores
}

/**
 * 根据题目数据计算每个维度的理论最小/最大原始分
 * 用于后续归一化，使各维度在 0~10 间合理分布
 */
export function computeScoreRanges(questions) {
  const dimMin = {}
  const dimMax = {}
  DIM_KEYS.forEach(k => { dimMin[k] = 0; dimMax[k] = 0 })

  questions.forEach(q => {
    DIM_KEYS.forEach(d => {
      let bestGain = -Infinity
      let worstGain = Infinity
      q.options.forEach(opt => {
        let gain = 0
        if (opt.primary === d) gain += 2
        if (opt.secondary === d) gain += 1
        if (opt.suppress === d) gain -= 1
        if (opt.suppress2 === d) gain -= 1
        if (gain > bestGain) bestGain = gain
        if (gain < worstGain) worstGain = gain
      })
      if (bestGain > 0) dimMax[d] += bestGain
      if (worstGain < 0) dimMin[d] += worstGain
    })
  })

  return { min: dimMin, max: dimMax }
}

/**
 * 原始分 → 0~10 归一化（使用按维度计算的理论范围）
 */
export function normalizeScores(rawScores, ranges) {
  return rawScores.map((s, i) => {
    const dim = DIM_KEYS[i]
    const min = ranges.min[dim]
    const max = ranges.max[dim]
    const span = max - min
    if (span <= 0) return 5
    const normalized = ((s - min) / span) * 10
    return Math.max(0, Math.min(10, Math.round(normalized)))
  })
}

/**
 * 归一化分 → L/M/H 等级
 */
export function scoresToLevels(normalizedScores, thresholds) {
  return normalizedScores.map(s => {
    if (s <= thresholds.L[1]) return 'L'
    if (s >= thresholds.H[0]) return 'H'
    return 'M'
  })
}

/**
 * 将向量值转成等级（与归一化阈值一致）
 */
function vectorToLevel(v) {
  if (v <= 3) return 'L'
  if (v >= 8) return 'H'
  return 'M'
}

/**
 * 余弦相似度（关注维度模式/形状而非绝对值）
 * 值域 -1~1，越高代表维度倾向越一致
 */
function cosineSimilarity(userVec, typeVec) {
  let dot = 0, normUser = 0, normType = 0
  for (let i = 0; i < DIM_COUNT; i++) {
    dot += userVec[i] * typeVec[i]
    normUser += userVec[i] * userVec[i]
    normType += typeVec[i] * typeVec[i]
  }
  const denom = Math.sqrt(normUser) * Math.sqrt(normType)
  return denom === 0 ? 0 : dot / denom
}

/**
 * 欧氏距离（供展示用）
 */
function euclideanDistance(userVec, typeVec) {
  let sum = 0
  for (let i = 0; i < DIM_COUNT; i++) {
    sum += Math.pow(userVec[i] - typeVec[i], 2)
  }
  return Math.sqrt(sum)
}

/**
 * 匹配所有类型，排序，应用特殊覆盖
 * 以余弦相似度为主排序（关注维度倾向模式），
 * level 命中率为辅。
 */
export function determineResult(userVector, rawScores, userLevels, standardTypes, specialTypes, config) {
  const rankings = standardTypes.map((type) => {
    const cosim = cosineSimilarity(userVector, type.vector)
    const sim = Math.max(0, Math.round((cosim + 1) / 2 * 100))
    const dist = euclideanDistance(userVector, type.vector)
    let exact = 0
    for (let i = 0; i < DIM_COUNT; i++) {
      if (userLevels[i] === vectorToLevel(type.vector[i])) exact++
    }
    return { ...type, similarity: sim, distance: dist, cosim, exact }
  })

  rankings.sort((a, b) => b.cosim - a.cosim || b.exact - a.exact)

  const best = rankings[0]

  // 特殊人格检测
  const specialResult = checkSpecialPersonality(rawScores, userVector, userLevels, specialTypes, config)
  if (specialResult) {
    return {
      primary: { ...specialResult, similarity: best.similarity, exact: best.exact },
      secondary: best,
      rankings,
      mode: 'special'
    }
  }

  return {
    primary: best,
    secondary: rankings[1] || null,
    rankings,
    mode: 'normal'
  }
}
