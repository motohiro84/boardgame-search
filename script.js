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

Object.keys(sheetMap).forEach(owner => {
  const label = document.createElement("label");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = owner;
  cb.checked = false;
  label.appendChild(cb);
  label.append(" " + owner);
  ownerCheckboxesDiv.appendChild(label);
});

function loadData() {
  resultTable.innerHTML = "";
  const showAll = document.getElementById("showAll").checked;
  const selectedOwners = [...ownerCheckboxesDiv.querySelectorAll("input:checked")].map(cb => cb.value);
  const targets = selectedOwners.length > 0 ? selectedOwners : Object.keys(sheetMap);

  Promise.all(
    targets.map(owner =>
      fetch(baseUrl(sheetMap[owner]))
        .then(res => res.text())
        .then(csv => parseCsv(csv).map(row => ({ owner, row })))
    )
  ).then(results => {
    const allRows = results.flat().filter(entry => {
      const [no, title, people, time, candidate] = entry.row.map(cell => cell?.trim() || "");
  
      if (!title) return false; // 空白は除外
      if (showAll) return true; // 全表示モード
      return candidate === "〇"; // 候補のみ
    });

    renderTable(allRows);
  });
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /("([^"]*(?:""[^"]*)*)"|[^,]*)(,|$)/g;
    const row = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let value = match[1];
      // ダブルクォートで囲まれていれば中身を整形
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      row.push(value.trim());
    }
    result.push(row);
  }

  return result;
}

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
