// Google Sheet + Gmail receiver for SGS booking form
// 1. Open a Google Sheet > Extensions > Apps Script > paste this
// 2. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone
// 3. Copy the Web app URL into SHEET_URL in index.html
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sh.getLastRow() === 0) sh.appendRow(["Time","Name","Phone","Device","Problem","Service"]);
  sh.appendRow([d.time, d.name, d.phone, d.device, d.issue, d.mode]);
  MailApp.sendEmail("spidergridsolutions@gmail.com",
    "New SGS booking: " + d.name + " (" + d.device + ")",
    "Name: " + d.name + "\nPhone: " + d.phone + "\nDevice: " + d.device +
    "\nProblem: " + d.issue + "\nService: " + d.mode + "\nTime: " + d.time);
  return ContentService.createTextOutput("ok");
}
