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
 * 原始分 → 0~10 归一化
 * 理论范围 -30~60，归一化到 0~10
 */
export function normalizeScores(rawScores) {
  const min = -30
  const max = 60
  return rawScores.map(s => {
    const normalized = ((s - min) / (max - min)) * 10
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

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 欧氏距离匹配
 */
function euclideanDistance(userVec, typeVec) {
  let sum = 0
  for (let i = 0; i < DIM_COUNT; i++) {
    sum += Math.pow(userVec[i] - typeVec[i], 2)
  }
  return Math.sqrt(sum)
}

/**
 * 计算相似度百分比（基于欧氏距离）
 * 最大可能距离 sqrt(15 * 100) ≈ 38.73
 */
function similarityFromDistance(dist) {
  const maxDist = Math.sqrt(DIM_COUNT * 100)
  return Math.max(0, Math.round((1 - dist / maxDist) * 100))
}

/**
 * 匹配所有类型，排序，应用特殊覆盖
 */
export function determineResult(userVector, rawScores, userLevels, standardTypes, specialTypes, config) {
  const rankings = standardTypes.map((type) => {
    const dist = euclideanDistance(userVector, type.vector)
    const sim = similarityFromDistance(dist)
    let exact = 0
    for (let i = 0; i < DIM_COUNT; i++) {
      if (LEVEL_NUM[userLevels[i]] === Math.round(type.vector[i] / 3.33)) exact++
    }
    return { ...type, distance: dist, similarity: sim, exact }
  })

  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity)

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
