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

// 全員チェックボックス
const allLabel = document.createElement("label");
const allCb = document.createElement("input");
allCb.type = "checkbox";
allCb.id = "checkAll";
allCb.checked = true;
allLabel.appendChild(allCb);
allLabel.append(" 全員");
ownerCheckboxesDiv.appendChild(allLabel);

// 各所持者チェックボックス
Object.keys(sheetMap).forEach(owner => {
  const label = document.createElement("label");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = owner;
  cb.checked = true;
  cb.classList.add("owner-check");
  label.appendChild(cb);
  label.append(" " + owner);
  ownerCheckboxesDiv.appendChild(label);
});

// 全員チェックの挙動
allCb.addEventListener("change", () => {
  const ownerCbs = document.querySelectorAll(".owner-check");
  ownerCbs.forEach(cb => cb.checked = allCb.checked);
});

// 個別チェックが外れたら「全員」も外す or 全部チェックなら全員に戻す
ownerCheckboxesDiv.addEventListener("change", () => {
  const ownerCbs = document.querySelectorAll(".owner-check");
  const allChecked = [...ownerCbs].every(cb => cb.checked);
  allCb.checked = allChecked;
});

// 初期ロードフラグ
let isFirstLoad = true;

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

      if (!title) return false;
      if (showAll) return true;
      return candidate === "〇";
    });

    // ボードゲーム名で昇順ソート
    allRows.sort((a, b) => a.row[1].localeCompare(b.row[1], 'ja'));

    renderTable(allRows);
  });

  isFirstLoad = false;
}

function parseCsv(text) {
  return text.trim().split("\n").slice(1).map(line =>
    line.split(",").map(cell => cell.trim())
  );
}

function renderTable(data) {
  resultTable.innerHTML = `
    <thead><tr>
      <th>所持者</th>
      <th>ボードゲーム</th>
      <th>人数</th>
      <th>時間</th>
    </tr></thead>
    <tbody>
      ${data.map(({ owner, row }) => `
        <tr>
          <td>${owner}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

// 初期読み込み時に自動実行
window.addEventListener("DOMContentLoaded", () => {
  if (isFirstLoad) loadData();
});
