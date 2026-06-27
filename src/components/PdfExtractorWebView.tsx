/**
 * PdfExtractorWebView — Hidden WebView that extracts text rows from a PDF
 * using PDF.js loaded from CDN. Sends base64 in 200 KB chunks to avoid
 * crashing the JS bridge on large files.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
const WebView = require('react-native-webview')
  .default as React.ComponentType<any>;

import ReactNativeBlobUtil from 'react-native-blob-util';
import { PDF_EXTRACTOR_HTML } from '../services/pdfExtractorHtml';

const CHUNK_SIZE = 200 * 1024; // 200 KB in base64 chars

interface PdfExtractorWebViewProps {
  pdfUri: string | null;
  onTextExtracted: (rows: string[]) => void;
  onError: (error: string) => void;
}

const PdfExtractorWebView: React.FC<PdfExtractorWebViewProps> = ({
  pdfUri,
  onTextExtracted,
  onError,
}) => {
  const webViewRef = useRef<any>(null);
  const pendingUriRef = useRef<string | null>(null);

  useEffect(() => {
    pendingUriRef.current = pdfUri;
  }, [pdfUri]);

  const injectPDF = useCallback(
    async (uri: string) => {
      try {
        const base64 = await ReactNativeBlobUtil.fs.readFile(
          uri.replace('file://', ''),
          'base64',
        );

        // Split into chunks and inject sequentially
        const total = base64.length;
        let offset = 0;
        while (offset < total) {
          const end = Math.min(offset + CHUNK_SIZE, total);
          const chunk = base64.slice(offset, end);
          const isLast = end >= total;
          webViewRef.current?.injectJavaScript(
            `window.receiveChunk(${JSON.stringify(chunk)}, ${isLast}); true;`,
          );
          offset = end;
          // Yield to JS thread between chunks to keep UI responsive
          await new Promise<void>(resolve => setTimeout(resolve, 5));
        }
      } catch (e: any) {
        onError('Failed to read PDF file: ' + (e?.message ?? String(e)));
      }
    },
    [onError],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'READY') {
          if (pendingUriRef.current) {
            injectPDF(pendingUriRef.current);
          }
        } else if (data.type === 'SUCCESS') {
          onTextExtracted(data.rows as string[]);
        } else if (data.type === 'ERROR') {
          onError(data.error as string);
        }
      } catch {
        onError('Failed to parse WebView message');
      }
    },
    [injectPDF, onTextExtracted, onError],
  );

  return (
    <View style={styles.hidden}>
      <WebView
        ref={webViewRef}
        source={{ html: PDF_EXTRACTOR_HTML }}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={onMessage}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: { width: 0, height: 0, overflow: 'hidden', position: 'absolute' },
  webview: { width: 1, height: 1 },
});

export default PdfExtractorWebView;
