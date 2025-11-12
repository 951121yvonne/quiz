// 變數宣告
let quizTable; // 儲存 p5.Table 物件
let questions = []; // 儲存從CSV讀取的題目
let currentQuestion; // 當前題目
let selectedQuestions = []; // 已選擇的題目
let currentQuestionIndex = 0; // 當前題目索引
let gameState = 'START'; // 遊戲狀態: START, QUIZ, ANSWERED, END
let buttonColor; // 按鈕顏色
let buttonOnColor, textColor, secondaryTextColor, bgColor, successColor, dangerColor, mutedColor, buttonHoverColor;
let correctAnswers = 0; // 正確答案數

// 特效相關變數
let shakeOffset = 0; // 震動偏移量
let shakeTime = 0; // 震動計時器
let feedbackText = ''; // 答題反饋文字
let feedbackColor; // 答題反饋顏色
let confetti = []; // 彩帶粒子陣列
let confettiLaunched = false; // *** 新增旗標: 記錄彩帶是否已噴發 ***

// 在 setup 和 draw 之前載入資源
function preload() {
  quizTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 讀取 CSS 變數，與 p5 顏色物件
  const root = getComputedStyle(document.documentElement);
  const mdBg = root.getPropertyValue('--md-bg').trim() || '#E6E3DE';
  const mdSurface = root.getPropertyValue('--md-surface').trim() || '#D9D6D1';
  const mdPrimaryText = root.getPropertyValue('--md-primary-text').trim() || '#3E3A39';
  const mdSecondaryText = root.getPropertyValue('--md-secondary-text').trim() || '#6F6B68';
  const mdAccent = root.getPropertyValue('--md-accent').trim() || '#9AA0A6';
  const mdAccentOn = root.getPropertyValue('--md-on-accent').trim() || '#FFFFFF';
  const mdSuccess = root.getPropertyValue('--md-success').trim() || '#9FB8A0';
  const mdDanger = root.getPropertyValue('--md-danger').trim() || '#B07C7C';
  const mdMuted = root.getPropertyValue('--md-muted').trim() || '#BDB6B2';

  // 將字串與 p5 顏色做部分對應（某些地方使用 p5 color 物件以便做亮度變化）
  buttonColor = color(mdAccent);
  buttonOnColor = mdAccentOn; // 字串，用於按鈕文字
  textColor = mdPrimaryText;
  secondaryTextColor = mdSecondaryText;
  bgColor = mdBg;
  successColor = color(mdSuccess);
  dangerColor = color(mdDanger);
  mutedColor = color(mdMuted);

  // hover 色（略微變亮）
  buttonHoverColor = lerpColor(buttonColor, color(255), 0.12);

  textSize(24);
  textAlign(CENTER, CENTER); // 確保所有文字預設置中對齊
  rectMode(CENTER); // 確保所有矩形預設以中心點繪製

  // 處理載入的資料
  questions = quizTable.rows.map(row => ({
    question: row.get('Question'),
    options: [
      row.get('OptionA'), 
      row.get('OptionB'), 
      row.get('OptionC'), 
      row.get('OptionD')
    ],
    // 將 'A', 'B', 'C', 'D' 轉換成 1, 2, 3, 4
    correct: row.get('CorrectOption').charCodeAt(0) - 'A'.charCodeAt(0) + 1 
  }));

  // 隨機選擇5題題目
  selectedQuestions = selectRandomQuestions(5);
  if (selectedQuestions.length > 0) {
    currentQuestion = selectedQuestions[0];
  } else {
    currentQuestion = { question: "錯誤：題庫為空！請檢查 CSV 檔案。", options: ["", "", "", ""], correct: 1 };
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 使用 CSS 背景色使畫布與頁面一致
  background(bgColor);
  // 科技感格線（細、低透明度）
  drawGrid(40, color(255, 255, 255, 12));
  
  // 震動特效計算和應用
  if (shakeTime > 0) {
    shakeOffset = random(-10, 10);
    shakeTime--;
  } else {
    shakeOffset = 0;
  }
  translate(shakeOffset, 0); // 將整個畫面水平位移，產生震動感
  
  switch(gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'QUIZ':
      drawQuizScreen();
      break;
    case 'ANSWERED':
      drawQuizScreen();
      drawFeedback();
      break;
    case 'END':
      drawEndScreen();
      break;
  }
  
  // 彩帶粒子繪製 (無論哪個狀態都持續繪製，但只在 END 狀態生成)
  for (let i = confetti.length - 1; i >= 0; i--) {
    confetti[i].update();
    confetti[i].draw();
    if (confetti[i].isFinished()) {
      confetti.splice(i, 1);
    }
  }
}

function selectRandomQuestions(count) {
  let shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function drawStartScreen() {
  fill(textColor);
  textSize(height * 0.08);
  text('測驗開始', width/2, height/3);
  
  // 開始按鈕 (置中)
  drawButton('開始測驗', width/2, height/2, width * 0.3, height * 0.1);
}

function drawQuizScreen() {
  // 設定題目區域
  fill(textColor);
  textSize(height * 0.04);
  // 題號部分
  text(`題目 ${currentQuestionIndex + 1}/5`, width/2, height * 0.1);
  
  // 題目文字換行處理
  textSize(height * 0.035);
  let questionText = currentQuestion.question;
  let wrappedText = wrapText(questionText, width * 0.8);
  let lineHeight = height * 0.05;
  
  // *** 修正點 2: 計算題目文字的起始 Y 座標，確保垂直置中 ***
  let totalTextHeight = wrappedText.length * lineHeight;
  
  // 題目文字區域中心點約在畫面 20% 處 (y=0.2)
  // 計算出讓題目置中於此區域的起始 Y 座標
  let startYCenter = height * 0.25; 
  let startY = startYCenter - totalTextHeight / 2;
  
  // 顯示題目
  textAlign(CENTER, TOP); // 文字置中對齊，但從頂部開始繪製
  wrappedText.forEach((line, i) => {
    text(line, width/2, startY + i * lineHeight);
  });
  
  // 選項按鈕
  let btnHeight = height * 0.1;
  let spacing = height * 0.03;
  let startBtnY = height * 0.45;
  let btnW = width * 0.7; // 按鈕寬度
  
  for(let i = 0; i < 4; i++) {
    let btnY = startBtnY + i * (btnHeight + spacing);
    let optionText = `${String.fromCharCode(65 + i)}. ${currentQuestion.options[i]}`;
    
    // 繪製矩形顏色 (互動與回饋)
    let rectFill = buttonColor;
    if (isMouseOverButton(width/2, btnY, btnW, btnHeight) && gameState === 'QUIZ') {
      rectFill = buttonHoverColor;
      // 設定發光陰影
      drawingContext.shadowBlur = 24;
      drawingContext.shadowColor = colorToCanvasShadow(buttonColor);
      cursor(HAND);
    } else {
      // 清除陰影
      drawingContext.shadowBlur = 0;
      cursor(ARROW);
    }

    if (gameState === 'ANSWERED') {
      if (i + 1 === currentQuestion.correct) {
        rectFill = successColor; // 正確: 使用 Morandi 成功色
      } else if (i + 1 === currentQuestion.selectedAnswer) {
        rectFill = dangerColor; // 錯誤: 使用 Morandi 錯誤色
      }
    }
    
    fill(rectFill);
    rect(width/2, btnY, btnW, btnHeight, 15);
  // 清除陰影確保文字不受陰影影響
  drawingContext.shadowBlur = 0;
    
    // 選項文字
    fill(buttonOnColor);
    textAlign(LEFT, CENTER);
    textSize(btnHeight * 0.3); // 選項文字大小依按鈕高度調整
    text(optionText, width/2 - btnW/2 + 30, btnY);
  }
  
  // 恢復中央對齊，以便繪製下一題或按鈕
  textAlign(CENTER, CENTER);
}

// 在畫面上繪製微弱的科技格線 (cellSize, p5 color)
function drawGrid(cellSize, strokeCol) {
  push();
  stroke(strokeCol);
  strokeWeight(1);
  for (let x = 0; x <= width; x += cellSize) {
    line(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += cellSize) {
    line(0, y, width, y);
  }
  pop();
}

// 將 p5 Color 轉為 canvas shadow 所需的 CSS 字串
function colorToCanvasShadow(p5col) {
  // p5col 可能是 p5 Color 物件
  let c = p5col;
  if (typeof p5col === 'string') c = color(p5col);
  return `rgba(${floor(red(c))}, ${floor(green(c))}, ${floor(blue(c))}, 0.9)`;
}

function drawFeedback() {
  push();
  // feedbackColor 在答題處理時已設為 p5 color（如 successColor / dangerColor）
  fill(feedbackColor || textColor);
  textSize(height * 0.05);
  text(feedbackText, width/2, height * 0.95);
  pop();
}

function wrapText(text, maxWidth) {
  let lines = [];
  let currentLine = '';
  
  // 確保文字可以換行，使用字元檢查
  for (let i = 0; i < text.length; i++) {
      let char = text.charAt(i);
      
      // 處理空格，避免空格成為一行的開頭
      if (char === ' ' && currentLine.endsWith(' ')) {
          continue; // 忽略多餘空格
      }
      
      if (textWidth(currentLine + char) > maxWidth) {
          lines.push(currentLine.trim());
          currentLine = char.trim();
      } else {
          currentLine += char;
      }
  }
  lines.push(currentLine.trim());
  return lines.filter(line => line.length > 0); // 過濾空行
}

function drawEndScreen() {
  // *** 修正點 3: 彩帶只在 END 狀態第一次進入時噴發 ***
  if (!confettiLaunched) {
     // 集中噴發 200 個粒子
     for (let i = 0; i < 200; i++) {
        // 從畫面中央偏上噴出
        confetti.push(new Confetti(width / 2, height * 0.4));
    }
    confettiLaunched = true;
  }
  
  fill(textColor);
  textAlign(CENTER, CENTER);
  textSize(height * 0.08);
  text('測驗結束', width/2, height/4);
  
  let percentage = (correctAnswers / 5) * 100;
  
  // 繪製成績圓環
  push();
  translate(width/2, height/2);
  noFill();
  strokeWeight(20);
  stroke(mutedColor);
  let circleSize = min(width, height) * 0.3;
  arc(0, 0, circleSize, circleSize, 0, TWO_PI);
  
  // 動態分數圓弧
  let arcEnd = map(percentage, 0, 100, -HALF_PI, -HALF_PI + TWO_PI);
  stroke(buttonColor);
  arc(0, 0, circleSize, circleSize, -HALF_PI, arcEnd);
  
  // 顯示分數
  noStroke();
  fill(textColor);
  textSize(height * 0.06);
  text(`${percentage.toFixed(0)}%`, 0, 0);
  pop();
  
  // 顯示回饋
  textSize(height * 0.04);
  let feedback = '';
  if (percentage === 100) feedback = '太棒了！完美表現！';
  else if (percentage >= 80) feedback = '很好！繼續保持！';
  else if (percentage >= 60) feedback = '及格了，還可以更好！';
  else feedback = '需要更多練習，加油！';
  
  text(feedback, width/2, height * 0.7);
  
  // 重新開始按鈕
  let restartBtnX = width/2;
  let restartBtnY = height * 0.85;
  let restartBtnW = width * 0.3;
  let restartBtnH = height * 0.1;

  drawButton('重新測驗', restartBtnX, restartBtnY, restartBtnW, restartBtnH);
}

function drawButton(label, x, y, w, h) {
  push();
  
  // 滑鼠懸停效果
  if (isMouseOverButton(x, y, w, h)) {
    fill(buttonHoverColor);
      cursor(HAND);
  } else {
      fill(buttonColor);
      cursor(ARROW);
  }
  rect(x, y, w, h, 15);
  fill(buttonOnColor);
  textAlign(CENTER, CENTER);
  textSize(h * 0.4); 
  text(label, x, y);
  pop();
}

function isMouseOverButton(x, y, w, h) {
  return mouseX > x - w/2 && mouseX < x + w/2 &&
         mouseY > y - h/2 && mouseY < y + h/2;
}

function mousePressed() {
  if (gameState === 'START') {
    if (isMouseOverButton(width/2, height/2, width * 0.3, height * 0.1)) {
      gameState = 'QUIZ';
    }
  } else if (gameState === 'QUIZ') {
    let btnHeight = height * 0.1;
    let spacing = height * 0.03;
    let startY = height * 0.45;
    let btnW = width * 0.7; 
    
    for(let i = 0; i < 4; i++) {
      let btnY = startY + i * (btnHeight + spacing);
      if (isMouseOverButton(width/2, btnY, btnW, btnHeight)) {
        
        let isCorrect = (i + 1 === currentQuestion.correct);
        currentQuestion.selectedAnswer = i + 1; 

        if (isCorrect) {
          correctAnswers++;
          feedbackText = '✔️ 正確！';
          feedbackColor = successColor;
        } else {
          shakeTime = 30; 
          feedbackText = '❌ 錯誤！正確答案是 ' + String.fromCharCode(65 + currentQuestion.correct - 1) + '。';
          feedbackColor = dangerColor;
        }
        
        gameState = 'ANSWERED';
        setTimeout(goToNextQuestion, 2000); 
        break;
      }
    }
  } else if (gameState === 'END') {
    let restartBtnX = width/2;
    let restartBtnY = height * 0.85;
    let restartBtnW = width * 0.3;
    let restartBtnH = height * 0.1;
    
    if (isMouseOverButton(restartBtnX, restartBtnY, restartBtnW, restartBtnH)) {
      // 重置遊戲
      currentQuestionIndex = 0;
      correctAnswers = 0;
      selectedQuestions = selectRandomQuestions(5);
      currentQuestion = selectedQuestions[0];
      gameState = 'START';
      confettiLaunched = false; // *** 重置彩帶旗標 ***
    }
  }
}

function goToNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < 5) {
    currentQuestion = selectedQuestions[currentQuestionIndex];
    gameState = 'QUIZ';
  } else {
    gameState = 'END';
  }
  feedbackText = ''; 
  currentQuestion.selectedAnswer = null;
}

// 彩帶粒子類別 (Confetti Class)
class Confetti {
  constructor(x, y) {
    this.pos = createVector(x, y); // 從中央開始
    this.vel = createVector(random(-6, 6), random(-20, -10)); // 向上噴射速度更大
    this.acc = createVector(0, 0.5); // 重力
    this.color = color(random(255), random(255), random(255), 200);
    this.w = random(5, 15);
    this.h = random(5, 15);
    this.life = 200;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.life--;
  }

  draw() {
    push();
    noStroke();
    fill(this.color);
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, this.w, this.h);
    pop();
  }

  isFinished() {
    return this.life < 0 || this.pos.y > height;
  }
}