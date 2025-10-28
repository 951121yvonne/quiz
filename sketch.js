// 變數宣告
let quizTable; // 儲存 p5.Table 物件
let questions = []; // 儲存從CSV讀取的題目
let currentQuestion; // 當前題目
let selectedQuestions = []; // 已選擇的題目
let currentQuestionIndex = 0; // 當前題目索引
let score = 0; // 分數 (未使用，建議使用 correctAnswers)
let gameState = 'START'; // 遊戲狀態: START, QUIZ, END
let buttonColor; // 按鈕顏色
let correctAnswers = 0; // 正確答案數

// 在 setup 和 draw 之前載入資源
function preload() {
  // *** 修正點 1: 移除回調函數，讓 loadTable 同步載入 ***
  // 載入CSV題庫
  quizTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600);
  buttonColor = color(100, 149, 237);
  textSize(20);
  
  // *** 修正點 2: 在 setup() 中處理載入的資料 ***
  // 根據您提供的 CSV 欄位名稱進行修正：Question, OptionA, OptionB, OptionC, OptionD, CorrectOption
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

  // 隨機選擇5題題目 (現在 questions 已經有資料了)
  selectedQuestions = selectRandomQuestions(5);
  // 檢查是否成功選取題目，如果題庫空了，會導致崩潰
  if (selectedQuestions.length > 0) {
    currentQuestion = selectedQuestions[0];
  } else {
    // 應急處理：如果題庫為空
    currentQuestion = { question: "錯誤：題庫為空！請檢查 CSV 檔案。", options: ["", "", "", ""], correct: 1 };
  }
}

function draw() {
  background(240);
  
  switch(gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'QUIZ':
      drawQuizScreen();
      break;
    case 'END':
      drawEndScreen();
      break;
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
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(40);
  text('測驗開始', width/2, height/3);
  
  // 開始按鈕
  drawButton('開始測驗', width/2, height/2, 200, 60);
}

function drawQuizScreen() {
  // 設定題目區域
  fill(0);
  textAlign(CENTER, TOP);
  textSize(24);
  text(`題目 ${currentQuestionIndex + 1}/5`, width/2, 50);
  
  // 題目文字換行處理
  textSize(20);
  let questionText = currentQuestion.question;
  let wrappedText = wrapText(questionText, width - 100);
  let lineHeight = 30;
  let startY = 100;
  
  wrappedText.forEach((line, i) => {
    text(line, width/2, startY + i * lineHeight);
  });

  // 選項按鈕
  let btnHeight = 70;
  let spacing = 20;
  let startBtnY = 250;
  
  for(let i = 0; i < 4; i++) {
    let btnY = startBtnY + i * (btnHeight + spacing);
    
    // 繪製矩形
    if (isMouseOverButton(width/2, btnY, 400, btnHeight)) {
      fill(120, 169, 255);
      cursor(HAND);
    } else {
      fill(100, 149, 237);
      cursor(ARROW);
    }
    rectMode(CENTER); // 確保 rect 以中心點繪製
    rect(width/2, btnY, 400, btnHeight, 15);
    
    // 選項文字
    fill(255);
    // *** 修正點 3: 確保選項文字在按鈕內左對齊且垂直居中 ***
    textAlign(LEFT, CENTER);
    text(`${String.fromCharCode(65 + i)}. ${currentQuestion.options[i]}`, 
          width/2 - 180, btnY); // 距離中心點 200/2 + 20 像素向左
  }
  
  // 恢復中央對齊
  textAlign(CENTER, CENTER);
}

// 新增文字換行函數
function wrapText(text, maxWidth) {
  // 為了簡化和避免更複雜的文字換行邏輯（例如中文），
  // 這裡假設題目內容不會有太多的空白字元需要拆分，僅使用簡單的字串長度判斷。
  // 您可以根據實際情況調整 maxChars 或使用更複雜的演算法
  
  let lines = [];
  let maxChars = floor(maxWidth / (textSize() * 0.5)); // 粗略估算每行可容納的字數
  let currentLine = '';
  
  for (let char of text) {
      // 檢查加上新字元後是否超過寬度
      if (textWidth(currentLine + char) > maxWidth) {
          lines.push(currentLine);
          currentLine = char;
      } else {
          currentLine += char;
      }
  }
  lines.push(currentLine);
  return lines;
}


// 新增滑鼠懸停檢測函數
function isMouseOverButton(x, y, w, h) {
  return mouseX > x - w/2 && mouseX < x + w/2 &&
         mouseY > y - h/2 && mouseY < y + h/2;
}

// 修改結束畫面，加入更豐富的視覺效果
function drawEndScreen() {
  background(240);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(40);
  text('測驗結束', width/2, height/4);
  
  let percentage = (correctAnswers / 5) * 100;
  
  // 繪製成績圓環
  push();
  translate(width/2, height/2);
  noFill();
  strokeWeight(20);
  stroke(200);
  arc(0, 0, 200, 200, 0, TWO_PI);
  
  // 動態分數圓弧
  let arcEnd = map(percentage, 0, 100, -HALF_PI, -HALF_PI + TWO_PI);
  stroke(100, 149, 237);
  arc(0, 0, 200, 200, -HALF_PI, arcEnd);
  
  // 顯示分數
  noStroke();
  fill(0);
  textSize(36);
  text(`${percentage.toFixed(0)}%`, 0, 0);
  pop();
  
  // 顯示回饋
  textSize(24);
  let feedback = '';
  if (percentage === 100) feedback = '太棒了！完美表現！';
  else if (percentage >= 80) feedback = '很好！繼續保持！';
  else if (percentage >= 60) feedback = '及格了，還可以更好！';
  else feedback = '需要更多練習，加油！';
  
  text(feedback, width/2, height/2 + 120);
  
  // 重新開始按鈕
  // 使用 drawButton 函數以保持一致性
  let restartBtnX = width/2;
  let restartBtnY = height/2 + 180;
  let restartBtnW = 200;
  let restartBtnH = 60;
  
  if (isMouseOverButton(restartBtnX, restartBtnY, restartBtnW, restartBtnH)) {
    fill(120, 169, 255);
    cursor(HAND);
  } else {
    fill(100, 149, 237);
    cursor(ARROW);
  }
  rect(restartBtnX, restartBtnY, restartBtnW, restartBtnH, 15);
  fill(255);
  textAlign(CENTER, CENTER);
  text('重新測驗', restartBtnX, restartBtnY);
}

function drawButton(label, x, y, w, h) {
  push();
  // 滑鼠懸停效果
  if (isMouseOverButton(x, y, w, h)) {
      fill(120, 169, 255);
      cursor(HAND);
  } else {
      fill(buttonColor);
      cursor(ARROW);
  }
  rectMode(CENTER);
  rect(x, y, w, h, 15);
  fill(255);
  textAlign(CENTER, CENTER);
  text(label, x, y);
  pop();
}

function mousePressed() {
  if (gameState === 'START') {
    // 檢查是否點擊開始按鈕
    if (isMouseOverButton(width/2, height/2, 200, 60)) {
      gameState = 'QUIZ';
    }
  } else if (gameState === 'QUIZ') {
    // 檢查是否點擊答案選項
    let btnHeight = 70; // 與 drawQuizScreen 保持一致
    let spacing = 20;
    let startY = 250; // 與 drawQuizScreen 保持一致
    
    for(let i = 0; i < 4; i++) {
      let btnY = startY + i * (btnHeight + spacing);
      if (isMouseOverButton(width/2, btnY, 400, btnHeight)) { // 使用 isMouseOverButton 檢查
        
        // 檢查答案: i 是 0, 1, 2, 3；currentQuestion.correct 是 1, 2, 3, 4
        if (i === currentQuestion.correct - 1) { 
          correctAnswers++;
        }
        
        // 移至下一題或結束
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
          currentQuestion = selectedQuestions[currentQuestionIndex];
        } else {
          gameState = 'END';
        }
        break;
      }
    }
  } else if (gameState === 'END') {
    // 檢查是否點擊重新開始按鈕
    let restartBtnX = width/2;
    let restartBtnY = height/2 + 180;
    let restartBtnW = 200;
    let restartBtnH = 60;
    
    if (isMouseOverButton(restartBtnX, restartBtnY, restartBtnW, restartBtnH)) {
      // 重置遊戲
      currentQuestionIndex = 0;
      correctAnswers = 0;
      selectedQuestions = selectRandomQuestions(5);
      
      // 確保有題目再設定 currentQuestion
      if (selectedQuestions.length > 0) {
        currentQuestion = selectedQuestions[0];
      } else {
        currentQuestion = { question: "錯誤：題庫為空！請檢查 CSV 檔案。", options: ["", "", "", ""], correct: 1 };
      }
      
      gameState = 'START';
    }
  }
}