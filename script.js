const sheetMap = {
  "小猿": "小猿",
  "善波": "善波",
  "小川": "小川",
  "山本": "山本",
  "安光": "安光"
};

const SPREADSHEET_ID = "1U4SfyivZyZGd8eXaFdSoWuSVP1GVjfkh86wez3Dzq1w";

const baseUrl = (sheet) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

const ownerCheckboxesDiv = document.getElementById("ownerCheckboxes");
const resultTable = document.getElementById("resultTable");

// 「全員」チェックボックスの追加
const allLabel = document.createElement("label");
const allCheckbox = document.createElement("input");
allCheckbox.type = "checkbox";
allCheckbox.id = "checkAllOwners";
allCheckbox.checked = true;
allLabel.appendChild(allCheckbox);
allLabel.append(" 全員");
ownerCheckboxesDiv.appendChild(allLabel);

// 所持者のチェックボックスを追加（初期状態は全てON）
Object.keys(sheetMap).forEach(owner => {
  const label = document.createElement("label");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = owner;
  cb.checked = true;
  cb.classList.add("owner-check");

  // 所持者のチェック変更時に「全員」のチェック状態を更新
  cb.addEventListener("change", () => {
    const allCbs = [...document.querySelectorAll(".owner-check")];
    const allChecked = allCbs.every(cb => cb.checked);
    allCheckbox.checked = allChecked;
    loadData();
  });

  label.appendChild(cb);
  label.append(" " + owner);
  ownerCheckboxesDiv.appendChild(label);
});

// 「全員」チェックの挙動
allCheckbox.addEventListener("change", () => {
  const checked = allCheckbox.checked;
  const ownerCbs = document.querySelectorAll(".owner-check");
  ownerCbs.forEach(cb => cb.checked = checked);
  loadData();
});

// データ読み込み関数
function loadData() {
  resultTable.innerHTML = "";
  const showAll = document.getElementById("showAll").checked;
  const selectedOwners = [...ownerCheckboxesDiv.querySelectorAll(".owner-check:checked")].map(cb => cb.value);
  const targets = selectedOwners.length > 0 ? selectedOwners : Object.keys(sheetMap);

  Promise.all(
    targets.map(owner =>
      fetch(baseUrl(sheetMap[owner]))
        .then(res => res.text())
        .then(csv => parseCsv(csv).map(row => ({ owner, row })))
    )
  ).then(results => {
    const allRows = results.flat().filter(entry => {
      const [no, title, people, time, candidate] =
        entry.row.map(cell => (cell || "").trim().replace(/^"|"$/g, ""));

      if (!title) return false; // ボードゲーム名が空なら除外
      if (showAll) return true; // 「候補以外も表示」がONならすべて表示
      return candidate === "〇"; // 候補が「〇」なら表示
    });

    renderTable(allRows);
  });
}

// CSVパース関数
function parseCsv(text) {
  return text.trim().split("\n").slice(1).map(line =>
    line.split(",").map(cell => cell.trim())
  );
}

// 表示テーブル生成
function renderTable(data) {
  resultTable.innerHTML = `
    <tr>
      <th>所持者</th>
      <th>ボードゲーム</th>
      <th>人数</th>
      <th>時間</th>
    </tr>
  ` + data.map(({ owner, row }) => `
    <tr>
      <td>${owner}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
    </tr>
  `).join("");
}

// 初期表示時に読み込み
window.addEventListener("load", () => {
  loadData();
});
