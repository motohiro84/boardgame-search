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
      console.log(entry.row)
      const [no, title, people, time, candidate] =
        entry.row.map(cell => (cell || "").trim().replace(/^"|"$/g, ""));

      if (!title) return false; // ボードゲーム名が空なら除外
      if (showAll) return true; // 「候補以外も表示」がONならすべて表示
      return candidate === "〇"; // 候補が「〇」なら表示
    });

    renderTable(allRows);
  });
}

function parseCsv(text) {
  return text.trim().split("\n").slice(1).map(line =>
    line.split(",").map(cell => cell.trim())
  );
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
