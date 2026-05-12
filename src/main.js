import { calcDimensionScores, normalizeScores, scoresToLevels, determineResult, computeScoreRanges } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'

import questionsData from '../data/questions.json'
import dimensionsData from '../data/dimensions.json'
import typesData from '../data/types.json'
import configData from '../data/config.json'

const pages = {
  intro: document.getElementById('page-intro'),
  quiz: document.getElementById('page-quiz'),
  result: document.getElementById('page-result'),
}

function showPage(name) {
  Object.values(pages).forEach((p) => p.classList.remove('active'))
  if (pages[name]) {
    pages[name].classList.add('active')
  }
  window.scrollTo(0, 0)
}

function onQuizComplete(rawAnswers) {
  const rawScores = calcDimensionScores(rawAnswers, questionsData.main)
  const ranges = computeScoreRanges(questionsData.main)
  const normalized = normalizeScores(rawScores, ranges)
  const levels = scoresToLevels(normalized, configData.scoring.levelThresholds)
  const result = determineResult(normalized, rawScores, levels, typesData.standard, typesData.special, configData)
  renderResult(result, normalized, levels, dimensionsData.order, dimensionsData.definitions, configData, typesData.standard)
  showPage('result')
}

const quiz = createQuiz(questionsData, configData, onQuizComplete)

document.getElementById('btn-start')?.addEventListener('click', () => {
  quiz.start()
  showPage('quiz')
})

document.getElementById('btn-restart')?.addEventListener('click', () => {
  quiz.start()
  showPage('quiz')
})
