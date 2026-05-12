import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }
const DIM_KEYS = ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15']

export function renderResult(result, userVector, userLevels, dimOrder, dimDefs, config, standardTypes) {
  const { primary, secondary, rankings } = result

  document.getElementById('result-kicker').textContent = '你的主类型'
  document.getElementById('result-name').textContent = primary.name

  const badge = document.getElementById('result-badge')
  badge.textContent = `契合度 ${primary.similarity}% · 命轮余影 ${secondary?.name || '无'}`

  document.getElementById('result-source').textContent = primary.source || ''

  const kwEl = document.getElementById('result-keywords')
  kwEl.innerHTML = ''
  if (primary.keywords) {
    primary.keywords.forEach(kw => {
      const span = document.createElement('span')
      span.className = 'keyword-tag'
      span.textContent = kw
      kwEl.appendChild(span)
    })
  }

  const quoteEl = document.getElementById('result-quote')
  const quoteCtxEl = document.getElementById('result-quote-context')
  if (primary.quotes && primary.quotes.length > 0) {
    quoteEl.textContent = `「${primary.quotes[0].text}」`
    quoteCtxEl.textContent = primary.quotes[0].context || ''
  } else {
    quoteEl.textContent = ''
    quoteCtxEl.textContent = ''
  }

  document.getElementById('result-bio').textContent = primary.bio || ''

  const tagsEl = document.getElementById('result-tags')
  if (primary.geminiTags) {
    tagsEl.textContent = primary.geminiTags
    tagsEl.style.display = ''
  } else {
    tagsEl.style.display = 'none'
  }

  document.getElementById('result-special-badge').style.display = 'none'

  const secEl = document.getElementById('result-secondary')
  if (secondary) {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent =
      `命轮余影：${secondary.name} · 契合度 ${secondary.similarity}%`
  } else {
    secEl.style.display = 'none'
  }

  // 雷达图
  const canvas = document.getElementById('radar-chart')
  drawRadar(canvas, userVector, userLevels, dimOrder, dimDefs)

  // 维度详情
  const detailEl = document.getElementById('dimensions-detail')
  detailEl.innerHTML = ''
  for (let i = 0; i < dimOrder.length; i++) {
    const dim = dimOrder[i]
    const level = userLevels[i] || 'M'
    const def = dimDefs[dim]
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'dim-row'
    row.innerHTML = `
      <div class="dim-header">
        <span class="dim-name">${dim} ${def.name}</span>
        <span class="dim-level ${LEVEL_CLASS[level]}">${LEVEL_LABEL[level]} · ${userVector[i]}</span>
      </div>
      <div class="dim-desc">${def.levels[level]}</div>
    `
    detailEl.appendChild(row)
  }

  // TOP 5
  const topEl = document.getElementById('top-list')
  topEl.innerHTML = ''
  const top5 = rankings.slice(0, 5)
  top5.forEach((t, i) => {
    const item = document.createElement('div')
    item.className = 'top-item'
    item.innerHTML = `
      <span class="top-rank">#${i + 1}</span>
      <span class="top-code">${t.name}</span>
      <span class="top-sim">${t.similarity}%</span>
      <span class="top-dist">距 ${t.distance.toFixed(1)}</span>
    `
    topEl.appendChild(item)
  })

  document.getElementById('disclaimer').textContent = config.display.funNote

  // 下载分享图
  const btnDownload = document.getElementById('btn-download')
  btnDownload.onclick = () => {
    generateShareImage(primary, userVector, dimOrder, dimDefs, config)
  }

  // 重新测试
  document.getElementById('btn-restart').onclick = () => {
    window.location.reload()
  }
}
