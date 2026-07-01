// このスクリプトを紐づけたスプレッドシート自身を自動で使用します。
const ss = SpreadsheetApp.getActiveSpreadsheet();

const QUESTION_SHEET_NAME = '質問';
// 工務店一覧から除外するシステムシート（「回答」は旧仕様の名残。新仕様では使用しない）
const SYSTEM_SHEETS = ['質問', '回答'];

// ===== 質問データの初期値（初回セットアップ時のみ使用） =====
const QUESTION_DATA = [
  ['初期設定', '工法', ''],
  ['初期設定', '階高', ''],
  ['初期設定', '軒妻の出', ''],
  ['初期設定', 'ボルトマスター', ''],
  ['初期設定', '表示設定', ''],
  ['入力設定', '垂木の配置', ''],
  ['入力設定', '垂木ピッチ', ''],
  ['入力設定', '窓台まぐさの柱欠き', ''],
  ['１F', '玄関柱', ''],
  ['１F', '玄関土台', ''],
  ['１F', '玄関框', ''],
  ['１F', '柱・地束・吊束', ''],
  ['１F', '横架材・継手', ''],
  ['１F', '床下点検口', ''],
  ['１F', '間柱', ''],
  ['１F', '筋交', ''],
  ['１F', '垂れ壁', ''],
  ['１F', 'HD', ''],
  ['１F', 'ダクト', ''],
  ['１F', '注記', ''],
  ['１F', '耐力壁', ''],
  ['開口部', 'カットあり？', ''],
  ['開口部', '１F中連', ''],
  ['開口部', '２F中連', ''],
  ['開口部', '掃出し', ''],
  ['開口部', '地窓', ''],
  ['開口部', '天付け', ''],
  ['２F', '階段框', ''],
  ['２F', '柱・地束', ''],
  ['２F', '横架材', ''],
  ['２F', '材成(外周材成など)', ''],
  ['２F', '間柱', ''],
  ['２F', '筋交', ''],
  ['２F', 'HD', ''],
  ['２F', 'ダクト', ''],
  ['２F', '注記', ''],
  ['２F', '耐力壁上', ''],
  ['２F', '笠木', ''],
  ['２F', '火打', ''],
  ['２F', 'パラペット', ''],
  ['ベランダ', '下げ', ''],
  ['ベランダ', '合板', ''],
  ['ベランダ', '笠木', ''],
  ['ベランダ', '笠木ボルト', ''],
  ['小屋', '横架材', ''],
  ['小屋', '材成(外周材成など)', ''],
  ['小屋', '束', ''],
  ['小屋', '吊木受け', ''],
  ['小屋', '火打', ''],
  ['小屋', '界壁', ''],
  ['小屋', '天井点検口', ''],
  ['小屋', '根太', ''],
  ['母屋', '母屋', ''],
  ['母屋', '母屋ボルト', ''],
  ['母屋', '垂木', ''],
  ['母屋', '合板の出', ''],
  ['母屋', '隅木谷木', ''],
  ['端柄材', '方立', ''],
  ['端柄材', '間柱受', ''],
  ['端柄材', '頭繋ぎ', ''],
  ['端柄材', 'スペーサー', ''],
  ['合板', '柱間柱欠きクリア', ''],
  ['金物', '短冊', ''],
  ['金物', 'HD', ''],
  ['準備材', '破風鼻隠し', '']
];

// ===== 初回セットアップ（「質問」シートが空のときだけ初期データを投入） =====
function initializeSheets() {
  const questionSheet = ss.getSheetByName(QUESTION_SHEET_NAME) || ss.insertSheet(QUESTION_SHEET_NAME);

  if (questionSheet.getLastRow() === 0) {
    questionSheet.appendRow(['No', '質問ID', 'カテゴリ', 'タイトル', '通常仕様']);
    const rows = QUESTION_DATA.map(function (item, i) {
      const idx = i + 1;
      const qId = 'Q' + ('000' + idx).slice(-3);
      return [idx, qId, item[0], item[1], item[2]];
    });
    questionSheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  questionSheet.setFrozenRows(1);
  questionSheet.autoResizeColumns(1, 5);

  Logger.log('セットアップ完了：質問シートを確認しました。');
}

// ===== ウェブアプリケーション =====
function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('仕様カードめくり');
}

function escapeHtmlServer(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===================================================================
// 質問シート（共通マスタ）関連
// ===================================================================

function getQuestionList_() {
  const sheet = ss.getSheetByName(QUESTION_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1]) {
      list.push({
        id: row[1],
        category: row[2] || '',
        title: row[3] || '',
        standard: row[4] || ''
      });
    }
  }
  return list;
}

// 質問編集タブ：現在の質問一覧を取得
function getQuestionsForEdit() {
  return getQuestionList_();
}

// 質問編集タブ：保存（追加・削除・並び替え・編集すべてここで一括反映）
// questionList: [{id, category, title, standard}, ...]  idが空文字なら新規発番
function saveQuestions(questionList) {
  const sheet = ss.getSheetByName(QUESTION_SHEET_NAME) || ss.insertSheet(QUESTION_SHEET_NAME);

  let maxNum = 0;
  questionList.forEach(function (q) {
    if (q.id && /^Q(\d+)$/.test(q.id)) {
      const n = parseInt(q.id.replace('Q', ''), 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const finalized = questionList.map(function (q, i) {
    let qId = q.id;
    if (!qId) {
      maxNum++;
      qId = 'Q' + ('000' + maxNum).slice(-3);
    }
    return [i + 1, qId, q.category || '', q.title || '', q.standard || ''];
  });

  sheet.clearContents();
  sheet.appendRow(['No', '質問ID', 'カテゴリ', 'タイトル', '通常仕様']);
  if (finalized.length > 0) {
    sheet.getRange(2, 1, finalized.length, 5).setValues(finalized);
  }
  sheet.setFrozenRows(1);

  return finalized.map(function (r) {
    return { id: r[1], category: r[2], title: r[3], standard: r[4] };
  });
}

// ===================================================================
// 工務店シート関連（工務店ごとに専用シートを作成・運用）
// ===================================================================

// シート名として使えない記号を除去し、20文字に丸める
function sanitizeSheetName_(name) {
  let s = String(name).trim();
  s = s.replace(/[\[\]\:\*\?\/\\]/g, '');
  if (s.length > 20) s = s.substring(0, 20);
  if (!s) s = '無題';
  return s;
}

// 工務店一覧（システムシートを除いた全シート名）
function listKoumuten() {
  const sheets = ss.getSheets();
  const names = [];
  sheets.forEach(function (sh) {
    const name = sh.getName();
    if (SYSTEM_SHEETS.indexOf(name) === -1) {
      names.push(name);
    }
  });
  names.sort();
  return names;
}

function getOrCreateKoumutenSheet_(koumenName) {
  const sheetName = sanitizeSheetName_(koumenName);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['質問ID', '回答']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ヒアリング画面の初期読み込み：質問マスタ＋その工務店の回答を返す
function getQuestionsAndAnswers(koumenName) {
  const questions = getQuestionList_();
  const sheet = getOrCreateKoumutenSheet_(koumenName);

  const data = sheet.getDataRange().getValues();
  const answers = {};
  for (let i = 1; i < data.length; i++) {
    const qId = data[i][0];
    const ans = data[i][1];
    if (qId && ans !== '' && ans !== undefined) answers[qId] = ans;
  }

  return { questions: questions, answers: answers, sheetName: sheet.getName() };
}

// 1問だけをその場で保存（入力のたびに呼ばれる軽量版）
function saveOneAnswer(koumenName, qId, value) {
  const sheet = getOrCreateKoumutenSheet_(koumenName);
  const data = sheet.getDataRange().getValues();

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === qId) { rowIndex = i + 1; break; }
  }

  if (value === '' || value === undefined || value === null) {
    if (rowIndex > 0) sheet.deleteRow(rowIndex);
    return;
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 2).setValue(value);
  } else {
    sheet.appendRow([qId, value]);
  }
}

// 一括保存（互換用。基本は saveOneAnswer を使う）
function saveAnswers(koumenName, answers) {
  const sheet = getOrCreateKoumutenSheet_(koumenName);
  const questions = getQuestionList_();

  const rows = [];
  questions.forEach(function (q) {
    const val = answers[q.id];
    if (val !== undefined && val !== '') rows.push([q.id, val]);
  });

  sheet.clearContents();
  sheet.appendRow(['質問ID', '回答']);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

// 工務店シートの削除
function deleteKoumuten(koumenName) {
  const sheetName = sanitizeSheetName_(koumenName);
  const sheet = ss.getSheetByName(sheetName);
  if (sheet) ss.deleteSheet(sheet);
}

// ===================================================================
// プレビュー生成
// ===================================================================

function generatePreview(koumenName, questions, answers) {
  const categoryMap = {};
  const categoryOrder = [];

  for (const q of questions) {
    const ans = answers[q.id];
    if (ans === undefined || ans === '') continue;

    if (!categoryMap[q.category]) {
      categoryMap[q.category] = [];
      categoryOrder.push(q.category);
    }
    categoryMap[q.category].push(ans);
  }

  if (categoryOrder.length === 0) {
    return '<div class="preview-line unanswered">特記事項なし（すべて通常仕様）</div>';
  }

  let html = '';
  for (const cat of categoryOrder) {
    html += '<div class="preview-category-title">' + escapeHtmlServer(cat) + '</div>';

    for (const content of categoryMap[cat]) {
      const lines = String(content).split('\n');
      html += '<div class="preview-item-block">';
      html += '<div class="preview-line">・' + escapeHtmlServer(lines[0]) + '</div>';
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        html += '<div class="preview-subline">' + escapeHtmlServer(lines[i]) + '</div>';
      }
      html += '</div>';
    }
  }

  return html;
}
