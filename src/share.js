const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }

export async function generateShareImage(primary, userVector, dimOrder, dimDefs, config) {
  const dpr = 2
  const W = 720
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 水墨背景
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, W, H)

  // 卡片
  const cardX = 32, cardY = 32, cardW = W - 64, cardH = H - 64
  roundRect(ctx, cardX, cardY, cardW, cardH, 20)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  let y = cardY + 48

  // Kicker
  ctx.textAlign = 'center'
  ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#8b8b8b'
  ctx.fillText('NBTI 人格测试', W / 2, y)
  y += 56

  // 角色名
  ctx.font = '900 56px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#1a1a2e'
  ctx.fillText(primary.name, W / 2, y)
  y += 52

  // 出处
  if (primary.source) {
    ctx.font = '400 20px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#8b8b8b'
    ctx.fillText(primary.source, W / 2, y)
    y += 40
  }

  // 契合度
  y += 8
  const badgeText = `契合度 ${primary.similarity}%`
  const badgeW = ctx.measureText(badgeText).width + 40
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 36, 18)
  ctx.fillStyle = '#f0ebe0'
  ctx.fill()
  ctx.fillStyle = '#c9a84c'
  ctx.fillText(badgeText, W / 2, y + 6)
  y += 50

  // 语录
  if (primary.quotes && primary.quotes[0]) {
    ctx.font = 'italic 500 18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#a83232'
    const quote = `「${primary.quotes[0].text}」`
    const quoteLines = wrapText(ctx, quote, cardW - 100)
    for (const line of quoteLines) {
      ctx.fillText(line, W / 2, y)
      y += 28
    }
    y += 8
  }

  // 雷达图
  const radarCx = W / 2
  const radarCy = y + 150
  const radarR = 130
  drawShareRadar(ctx, radarCx, radarCy, radarR, userVector, dimOrder, dimDefs)
  y = radarCy + radarR + 40

  // 维度条形图
  y += 10
  ctx.textAlign = 'left'
  const barX = cardX + 48
  const barMaxW = cardW - 96
  const dimNameW = 80

  for (let i = 0; i < dimOrder.length; i++) {
    const dim = dimOrder[i]
    const val = Math.round(userVector[i] / 10 * 3)
    const def = dimDefs[dim]
    if (!def) continue

    const name = def.name
    const levelVal = userVector[i]

    ctx.font = '500 14px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(name, barX, y)

    const progX = barX + dimNameW
    const progW = barMaxW - dimNameW - 50
    const progH = 10
    roundRect(ctx, progX, y - 8, progW, progH, 5)
    ctx.fillStyle = '#f0ebe0'
    ctx.fill()

    const fillW = (userVector[i] / 10) * progW
    roundRect(ctx, progX, y - 8, fillW, progH, 5)
    ctx.fillStyle = levelVal >= 8 ? '#a83232' : levelVal >= 4 ? '#c9a84c' : '#8b8b8b'
    ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = '500 12px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#8b8b8b'
    ctx.fillText(levelVal.toFixed(0), barX + barMaxW, y)
    ctx.textAlign = 'left'

    y += 24
  }

  y += 16

  // 底部水印
  ctx.textAlign = 'center'
  ctx.font = '400 16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#b0b0b0'
  ctx.fillText('NBTI 人格测试 · 仅供娱乐', W / 2, H - cardY - 24)

  const link = document.createElement('a')
  link.download = `NBTI-${primary.name}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function drawShareRadar(ctx, cx, cy, maxR, userVector, dimOrder, dimDefs) {
  const n = dimOrder.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2

  for (let lv = 3; lv >= 1; lv--) {
    const r = (lv / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = lv === 3 ? 'rgba(201,168,76,0.05)' : lv === 2 ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(201,168,76,0.1)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.font = '400 11px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(26,26,46,0.08)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const lr = maxR + 24
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    const label = dimDefs[dimOrder[i]]?.name || dimOrder[i]
    ctx.fillStyle = '#5a5a5a'
    ctx.fillText(label, lx, ly)
  }

  const values = userVector.map(v => (v / 10) * 3)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(168,50,50,0.12)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(168,50,50,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#a83232'
    ctx.fill()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
