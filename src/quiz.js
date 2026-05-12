import { shuffle } from './utils.js'

export function createQuiz(questions, config, onComplete) {
  const mainQuestions = shuffle(questions.main)
  let queue = mainQuestions
  let current = 0
  let answers = {}

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    stage: document.getElementById('cultivation-stage'),
    qText: document.getElementById('question-text'),
    qModule: document.getElementById('question-module'),
    options: document.getElementById('options'),
  }

  function totalCount() {
    return queue.length
  }

  function getCultivationStage(answered) {
    const stages = config.cultivation.stages
    for (const s of stages) {
      if (answered >= s.min && answered <= s.max) return s
    }
    return stages[stages.length - 1]
  }

  function updateProgress() {
    const pct = (current / totalCount()) * 100
    const stage = getCultivationStage(current)
    els.fill.style.width = pct + '%'
    els.text.textContent = `${current} / ${totalCount()}`
    els.stage.textContent = stage ? `【${stage.name}】${stage.desc}` : ''
  }

  function renderQuestion() {
    const q = queue[current]
    els.qText.textContent = q.text
    els.qModule.textContent = `— ${q.module} —`

    els.options.innerHTML = ''
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn-option'
      btn.textContent = `${opt.label}. ${opt.text}`
      btn.addEventListener('click', () => selectOption(q, idx))
      els.options.appendChild(btn)
    })

    updateProgress()
  }

  function selectOption(question, optionIndex) {
    answers[question.id] = optionIndex

    current++
    if (current >= totalCount()) {
      onComplete(answers)
    } else {
      renderQuestion()
    }
  }

  function start() {
    current = 0
    answers = {}
    queue = shuffle(questions.main)
    renderQuestion()
  }

  return { start, renderQuestion }
}
