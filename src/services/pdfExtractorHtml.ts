export const PDF_EXTRACTOR_HTML: string = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<script>
  var ROW_THRESHOLD = 4;
  var _chunks = [];

  function postMsg(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  // Called repeatedly from RN with successive base64 chunks
  window.receiveChunk = function(chunk, isLast) {
    _chunks.push(chunk);
    if (isLast) {
      var fullBase64 = _chunks.join('');
      _chunks = [];
      window.extractPDFText(fullBase64);
    }
  };

  window.extractPDFText = async function(base64Data) {
    try {
      var binaryString = atob(base64Data);
      var len = binaryString.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      var pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      var allRows = [];

      for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        var page = await pdf.getPage(pageNum);
        var textContent = await page.getTextContent();
        var items = textContent.items;

        var rowMap = {};
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var y = item.transform[5];
          var x = item.transform[4];
          var text = (item.str || '').trim();
          if (!text) continue;

          var rowKey = null;
          var keys = Object.keys(rowMap);
          for (var k = 0; k < keys.length; k++) {
            if (Math.abs(parseFloat(keys[k]) - y) <= ROW_THRESHOLD) {
              rowKey = keys[k];
              break;
            }
          }
          if (rowKey === null) {
            rowKey = String(y);
            rowMap[rowKey] = [];
          }
          rowMap[rowKey].push({ x: x, text: text });
        }

        var sortedYKeys = Object.keys(rowMap).sort(function(a, b) {
          return parseFloat(b) - parseFloat(a);
        });

        for (var r = 0; r < sortedYKeys.length; r++) {
          var rowItems = rowMap[sortedYKeys[r]];
          rowItems.sort(function(a, b) { return a.x - b.x; });
          var rowText = rowItems.map(function(it) { return it.text; }).join('\\t');
          if (rowText.trim().length > 0) {
            allRows.push(rowText);
          }
        }
      }

      postMsg({ type: 'SUCCESS', rows: allRows });
    } catch (err) {
      postMsg({ type: 'ERROR', error: (err && err.message) ? err.message : String(err) });
    }
  };

  // Load PDF.js from CDN with a 15-second timeout
  var cdnLoaded = false;
  var timeoutId = setTimeout(function() {
    if (!cdnLoaded) {
      postMsg({ type: 'ERROR', error: 'PDF.js CDN load timed out. Check your internet connection.' });
    }
  }, 15000);

  var script = document.createElement('script');
  script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
  script.onload = function() {
    cdnLoaded = true;
    clearTimeout(timeoutId);
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    postMsg({ type: 'READY' });
  };
  script.onerror = function() {
    cdnLoaded = true;
    clearTimeout(timeoutId);
    postMsg({ type: 'ERROR', error: 'Failed to load PDF.js from CDN. Check internet connection.' });
  };
  document.head.appendChild(script);
</script>
</body>
</html>`;
