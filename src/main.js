import { calcDimensionScores, normalizeScores, scoresToLevels, determineResult, computeScoreRanges } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'

let questionsData, dimensionsData, typesData, configData

async function init() {
  try {
    ;[questionsData, dimensionsData, typesData, configData] = await Promise.all([
      fetch('data/questions.json').then(r => r.json()),
      fetch('data/dimensions.json').then(r => r.json()),
      fetch('data/types.json').then(r => r.json()),
      fetch('data/config.json').then(r => r.json()),
    ])

    const pages = {
      intro: document.getElementById('page-intro'),
      quiz: document.getElementById('page-quiz'),
      result: document.getElementById('page-result'),
    }

    function showPage(name) {
      Object.values(pages).forEach((p) => p.classList.remove('active'))
      if (pages[name]) pages[name].classList.add('active')
      window.scrollTo(0, 0)
    }

    function onQuizComplete(rawAnswers) {
      const rawScores = calcDimensionScores(rawAnswers, questionsData.main)
      const ranges = computeScoreRanges(questionsData.main)
      const normalized = normalizeScores(rawScores, ranges)
      const levels = scoresToLevels(normalized, configData.scoring.levelThresholds)
      const result = determineResult(normalized, levels, typesData.standard)
      renderResult(result, normalized, levels, dimensionsData.order, dimensionsData.definitions, configData, typesData.standard)
      showPage('result')
    }

    const quiz = createQuiz(questionsData, configData, onQuizComplete)

    document.getElementById('btn-start').addEventListener('click', () => {
      quiz.start()
      showPage('quiz')
    })

    document.getElementById('btn-restart').addEventListener('click', () => {
      quiz.start()
      showPage('quiz')
    })
  } catch (err) {
    console.error('NBTI初始化失败:', err)
  }
}

init()
