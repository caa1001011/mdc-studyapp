/**
 * Google Apps Script Bridge cho Beacon Learn
 * Triển khai 1 lần dưới tài khoản Google Drive cá nhân của bạn:
 *   - Execute as: Me (tài khoản Google Drive của bạn)
 *   - Who has access: Anyone
 *
 * Mọi quản trị viên trên web đều upload thẳng vào:
 *   My Drive\BeaconLearn\<Tên môn>\<Tên thư mục bài>\<Tên file>
 * mà KHÔNG hiện hộp thoại chọn tài khoản Google.
 */

var ROOT_FOLDER_NAME = 'BeaconLearn';

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSubFolder(parentFolder, name) {
  var iter = parentFolder.getFoldersByName(name);
  if (iter.hasNext()) {
    return iter.next();
  }
  return parentFolder.createFolder(name);
}

function ensureFolderPath(subjectName, lessonFolderName) {
  var rootDrive = DriveApp.getRootFolder();
  var beaconRoot = getOrCreateSubFolder(rootDrive, ROOT_FOLDER_NAME);
  var subjectFolder = getOrCreateSubFolder(beaconRoot, subjectName || 'Chung');
  var lessonFolder = getOrCreateSubFolder(subjectFolder, lessonFolderName || 'Bài học');
  return lessonFolder;
}

function doGet() {
  return jsonResponse({ ok: true, service: 'BeaconLearn Drive Bridge' });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = body.action;

    if (action === 'initUpload') {
      var folder = ensureFolderPath(body.subjectName, body.folderName);
      var token = ScriptApp.getOAuthToken();
      var mimeType = body.mimeType || 'video/mp4';

      var headers = {
        Authorization: 'Bearer ' + token,
        'X-Upload-Content-Type': mimeType
      };
      if (body.fileSize) {
        headers['X-Upload-Content-Length'] = String(body.fileSize);
      }
      if (body.origin) {
        headers.Origin = String(body.origin);
      }

      var initRes = UrlFetchApp.fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
        {
          method: 'post',
          contentType: 'application/json; charset=UTF-8',
          headers: headers,
          payload: JSON.stringify({
            name: body.fileName || 'video.mp4',
            parents: [folder.getId()]
          }),
          muteHttpExceptions: true
        }
      );

      var status = initRes.getResponseCode();
      if (status < 200 || status >= 300) {
        return jsonResponse({
          ok: false,
          error: 'Google Drive trả về lỗi HTTP ' + status + ': ' + initRes.getContentText()
        });
      }

      var allHeaders = initRes.getAllHeaders();
      var uploadUrl = allHeaders.Location || allHeaders.location;
      if (!uploadUrl) {
        return jsonResponse({ ok: false, error: 'Không nhận được uploadUrl từ Google Drive.' });
      }

      return jsonResponse({
        ok: true,
        uploadUrl: uploadUrl,
        folderId: folder.getId()
      });
    }

    if (action === 'shareFile') {
      var file = DriveApp.getFileById(body.fileId);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({
        ok: true,
        fileId: file.getId(),
        webViewLink: file.getUrl()
      });
    }

    if (action === 'deleteFile') {
      if (body.fileId) {
        DriveApp.getFileById(body.fileId).setTrashed(true);
      }
      return jsonResponse({ ok: true });
    }

    if (action === 'gemini') {
      var geminiApiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!geminiApiKey || !String(geminiApiKey).trim()) {
        return jsonResponse({
          ok: false,
          error: 'Chưa cấu hình GEMINI_API_KEY trong Apps Script (Cài đặt dự án -> Thuộc tính tập lệnh).'
        });
      }

      var model = String(body.model || 'gemini-3.5-flash-lite').trim();
      var geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/' +
        encodeURIComponent(model) +
        ':generateContent?key=' +
        encodeURIComponent(String(geminiApiKey).trim());

      var geminiPayload = {
        contents: body.contents || [{ parts: [{ text: String(body.prompt || '') }] }],
        generationConfig: body.generationConfig || { temperature: 0.3 }
      };

      var aiRes = UrlFetchApp.fetch(geminiUrl, {
        method: 'post',
        contentType: 'application/json; charset=UTF-8',
        payload: JSON.stringify(geminiPayload),
        muteHttpExceptions: true
      });

      var aiStatus = aiRes.getResponseCode();
      var aiText = aiRes.getContentText();
      if (aiStatus < 200 || aiStatus >= 300) {
        return jsonResponse({
          ok: false,
          error: 'Gemini API lỗi HTTP ' + aiStatus + ': ' + aiText.slice(0, 300)
        });
      }

      var aiData = JSON.parse(aiText);
      var candidateText =
        (aiData &&
          aiData.candidates &&
          aiData.candidates[0] &&
          aiData.candidates[0].content &&
          aiData.candidates[0].content.parts &&
          aiData.candidates[0].content.parts[0] &&
          aiData.candidates[0].content.parts[0].text) ||
        '';

      return jsonResponse({
        ok: true,
        text: candidateText
      });
    }

    return jsonResponse({ ok: false, error: 'Hành động không hợp lệ: ' + action });
  } catch (err) {
    var rawMsg = err && err.message ? err.message : String(err);
    var safeMsg = String(rawMsg).replace(/([?&]key=)[^&\s]+/gi, '$1***');
    return jsonResponse({
      ok: false,
      error: safeMsg
    });
  }
}
