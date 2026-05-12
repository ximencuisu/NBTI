import { calcDimensionScores, normalizeScores, scoresToLevels, determineResult } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'

// 注意：已删除 import './style.css'，浏览器原生环境不支持在 JS 中直接导入 CSS

async function loadJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`无法加载配置文件: ${path}`);
  return res.json()
}

async function init() {
  try {
    const [questions, dimensions, types, config] = await Promise.all([
      loadJSON(new URL('../data/questions.json', import.meta.url).href),
      loadJSON(new URL('../data/dimensions.json', import.meta.url).href),
      loadJSON(new URL('../data/types.json', import.meta.url).href),
      loadJSON(new URL('../data/config.json', import.meta.url).href),
    ])

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
      const rawScores = calcDimensionScores(rawAnswers, questions.main)
      const normalized = normalizeScores(rawScores)
      const levels = scoresToLevels(normalized, config.scoring.levelThresholds)
      const result = determineResult(normalized, rawScores, levels, types.standard, types.special, config)
      renderResult(result, normalized, levels, dimensions.order, dimensions.definitions, config, types.standard)
      showPage('result')
    }

    const quiz = createQuiz(questions, config, onQuizComplete)

    // 绑定开始按钮
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        quiz.start()
        showPage('quiz')
      })
    }

    // 绑定重新开始按钮
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        quiz.start()
        showPage('quiz')
      })
    }

  } catch (error) {
    console.error("初始化失败:", error)
  }
}

init()
