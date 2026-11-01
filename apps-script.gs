/**
 * SGS website backend: email OTP admin + public news feed.
 * Deploy as Web App: Execute as you, access Anyone.
 * Set Script Properties: SPREADSHEET_ID, ADMIN_EMAIL=spidergridsolutions@gmail.com
 * Optional: DRIVE_FOLDER_ID for uploaded post images.
 */
const ADMIN_EMAIL = 'spidergridsolutions@gmail.com';
const OTP_TTL = 300;
const SESSION_TTL = 21600;
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'posts') return json_({posts: listPosts_()});
  return json_({ok:true, service:'SGS website API'});
}
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (d.action) {
      case 'requestOtp': return requestOtp_(d);
      case 'verifyOtp': return verifyOtp_(d);
      case 'createPost': return createPost_(d);
      case 'deletePost': return deletePost_(d);
      case 'booking': return saveBooking_(d);
      default: return json_({ok:false,error:'Unknown action'});
    }
  } catch (err) { return json_({ok:false,error:String(err.message || err)}); }
}
function requestOtp_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  if (email !== ADMIN_EMAIL) return json_({ok:false,error:'This email is not authorised.'});
  const cache = CacheService.getScriptCache();
  if (cache.get('otp_lock_' + email)) return json_({ok:false,error:'Please wait 60 seconds before requesting another code.'});
  cache.remove('otp_tries_' + email);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('otp_' + email, salt + ':' + sha256_(salt + otp));
  cache.put('otp_lock_' + email, '1', 60);
  cache.put('otp_exp_' + email, '1', OTP_TTL);
  MailApp.sendEmail({to:ADMIN_EMAIL,subject:'Your SGS website admin OTP',body:'Your one-time login code is: ' + otp + '\n\nIt expires in 5 minutes. If you did not request it, ignore this email.'});
  return json_({ok:true,message:'OTP sent to the authorised Gmail address.'});
}
function verifyOtp_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const otp = String(d.otp || '').trim();
  if (email !== ADMIN_EMAIL || !/^\d{6}$/.test(otp)) return json_({ok:false,error:'Invalid login.'});
  const cache = CacheService.getScriptCache();
  if (Number(cache.get('otp_tries_' + email) || 0) >= 5) return json_({ok:false,error:'Too many attempts. Request a new OTP after 5 minutes.'});
  if (!cache.get('otp_exp_' + email)) return json_({ok:false,error:'OTP expired. Request a new code.'});
  const prop = PropertiesService.getScriptProperties();
  const saved = prop.getProperty('otp_' + email) || '';
  const bits = saved.split(':');
  if (bits.length !== 2 || bits[1] !== sha256_(bits[0] + otp)) { cache.put('otp_tries_' + email, String(Number(cache.get('otp_tries_' + email) || 0) + 1), OTP_TTL); return json_({ok:false,error:'Incorrect OTP.'}); }
  prop.deleteProperty('otp_' + email); cache.remove('otp_exp_' + email); cache.remove('otp_tries_' + email);
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put('session_' + sha256_(token), email, SESSION_TTL);
  return json_({ok:true,token:token,expiresIn:SESSION_TTL});
}
function saveBooking_(d) {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
  let sh = ss.getSheetByName('Bookings'); if (!sh) sh = ss.insertSheet('Bookings');
  if (sh.getLastRow() === 0) sh.appendRow(['Time','Name','Phone','Device','Problem','Service']);
  sh.appendRow([new Date(),String(d.name||'').slice(0,100),String(d.phone||'').slice(0,20),String(d.device||'').slice(0,100),String(d.issue||'').slice(0,1000),String(d.mode||'').slice(0,100)]);
  MailApp.sendEmail({to:ADMIN_EMAIL,subject:'New SGS website enquiry: '+String(d.name||'Customer'),body:'Name: '+d.name+'\\nPhone: '+d.phone+'\\nDevice: '+d.device+'\\nProblem: '+d.issue+'\\nService: '+d.mode});
  return json_({ok:true});
}
function createPost_(d) {
  if (!authorised_(d.token)) return json_({ok:false,error:'Session expired. Log in again.'});
  const title = String(d.title || '').trim().slice(0,100);
  const body = String(d.body || '').trim().slice(0,1000);
  if (!title || !body) return json_({ok:false,error:'Title and post text are required.'});
  let imageUrl = '';
  if (d.imageData && d.imageMime) imageUrl = saveImage_(d.imageData, d.imageMime);
  const sh = sheet_();
  if (sh.getLastRow() === 0) sh.appendRow(['ID','Published','Title','Body','Image URL','Status']);
  sh.appendRow([Utilities.getUuid(),new Date(),title,body,imageUrl,'PUBLISHED']);
  return json_({ok:true});
}
function deletePost_(d) {
  if (!authorised_(d.token)) return json_({ok:false,error:'Session expired. Log in again.'});
  const sh = sheet_();
  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) if (String(rows[i][0]) === String(d.id)) { sh.deleteRow(i+1); return json_({ok:true}); }
  return json_({ok:false,error:'Post not found.'});
}
function listPosts_() {
  const sh = sheet_(); if (sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1).filter(r => String(r[5]) === 'PUBLISHED')
    .map(r => ({id:String(r[0]),date:r[1] instanceof Date ? r[1].toISOString() : String(r[1]),title:String(r[2]),body:String(r[3]),image:String(r[4] || '')}))
    .reverse().slice(0,30);
}
function authorised_(token) {
  if (!token || typeof token !== 'string') return false;
  return CacheService.getScriptCache().get('session_' + sha256_(token)) === ADMIN_EMAIL;
}
function saveImage_(data, mime) {
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) throw new Error('Only JPG, PNG or WebP images are allowed.');
  if (String(data).length > 4500000) throw new Error('Image is too large. Please upload an image under 3 MB.');
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('DRIVE_FOLDER_ID');
  let folder;
  if (folderId) folder = DriveApp.getFolderById(folderId);
  else { folder = DriveApp.createFolder('SGS Website News Images'); props.setProperty('DRIVE_FOLDER_ID', folder.getId()); }
  const bytes = Utilities.base64Decode(data);
  const ext = mime === 'image/png' ? 'png' : (mime === 'image/webp' ? 'webp' : 'jpg');
  const file = folder.createFile(Utilities.newBlob(bytes,mime,'sgs-news-' + Date.now() + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}
function sheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Set SPREADSHEET_ID in Apps Script project settings.');
  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName('News');
  if (!sh) sh = ss.insertSheet('News');
  return sh;
}
function sha256_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b => ('0'+(b&255).toString(16)).slice(-2)).join(''); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
