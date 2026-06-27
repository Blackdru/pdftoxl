/**
 * API Service Module for PDF to Excel
 */

import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, PermissionsAndroid } from 'react-native';

const getBaseUrl = 'https://app.robotpdf.com';
const PDF_TO_EXCEL_API_ENDPOINT = `${getBaseUrl}/api/pdftoxl`;

const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  
  try {
    if (Platform.Version >= 29) return true;
    
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to save files to Downloads folder',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export type ProgressCallback = (progress: number) => void;

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ConversionResult {
  fileBase64: string;
  fileName: string;
  fileSize: number;
  format: string;
}

/**
 * Converts PDF to Excel
 */
export const convertPDFToExcel = async (
  file: SelectedFile,
  onProgress?: ProgressCallback
): Promise<ConversionResult> => {
  try {
    if (!file) {
      throw new ApiError('A PDF file is required', 400);
    }

    if (file.size && file.size > 50 * 1024 * 1024) {
      throw new ApiError('File size exceeds 50MB limit', 400);
    }

    console.log('PDF to Excel Request:', { fileName: file.name, size: file.size });
    console.log('Uploading to:', PDF_TO_EXCEL_API_ENDPOINT);

    const formData = [{
      name: 'file',
      filename: file.name,
      type: 'application/pdf',
      data: ReactNativeBlobUtil.wrap(file.uri.replace('file://', '')),
    }];

    const response = await ReactNativeBlobUtil.fetch(
      'POST',
      PDF_TO_EXCEL_API_ENDPOINT,
      { 'Content-Type': 'multipart/form-data' },
      formData,
    )
      .uploadProgress({ interval: 100 }, (written, total) => {
        const progress = written / total;
        console.log(`Upload progress: ${Math.round(progress * 100)}%`);
        onProgress?.(progress);
      })
      .progress((received, total) => {
        console.log(`Download progress: ${received}/${total}`);
      });

    const status = response.respInfo.status;
    console.log('Response status:', status);

    if (status >= 200 && status < 300) {
      const data = response.json();
      const responseData = data.data || data;
      
      return {
        fileBase64: responseData.file_base64 || responseData.fileBase64 || '',
        fileName: responseData.file_name || responseData.fileName || file.name.replace(/\.pdf$/i, '.xlsx'),
        fileSize: responseData.file_size || responseData.fileSize || 0,
        format: responseData.format || 'xlsx',
      };
    } else {
      let errorMsg = `Server error: ${status}`;
      try {
        const errorData = response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {}
      throw new ApiError(errorMsg, status);
    }
  } catch (error: any) {
    console.log('Conversion Error:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'An unexpected error occurred', 500);
  }
};

/**
 * Saves converted Excel file to device storage
 */
export const saveConvertedFile = async (
  base64Data: string,
  fileName: string,
): Promise<string> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      throw new ApiError('Storage permission denied', 403);
    }

    const { dirs, writeFile } = ReactNativeBlobUtil.fs;
    
    // Clean the base64 string - remove any whitespace or newlines that might corrupt the file
    const cleanBase64 = base64Data.replace(/[\s\n\r]/g, '');
    
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    let downloadPath: string;
    
    if (Platform.OS === 'android') {
      // Use DownloadDir which works with scoped storage on Android 10+
      const downloadDir = dirs.DownloadDir;
      downloadPath = `${downloadDir}/${fileName}`;
      
      // Write the file to Downloads directory
      await writeFile(downloadPath, cleanBase64, 'base64');
      
      // Add to downloads manager for visibility in Downloads app and notification
      try {
        await ReactNativeBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: 'Converted Excel file from PDF',
          mime: mimeType,
          path: downloadPath,
          showNotification: true,
        });
      } catch (e) {
        console.log('addCompleteDownload warning:', e);
      }
      
      // Notify the media scanner so the file appears immediately
      try {
        await ReactNativeBlobUtil.fs.scanFile([{ path: downloadPath, mime: mimeType }]);
      } catch (e) {
        console.log('scanFile warning:', e);
      }
    } else {
      // iOS - use DocumentDir
      downloadPath = `${dirs.DocumentDir}/${fileName}`;
      await writeFile(downloadPath, cleanBase64, 'base64');
    }

    console.log('File saved to:', downloadPath);
    return downloadPath;
  } catch (error: any) {
    console.error('Save error:', error);
    throw new ApiError(error.message || 'Failed to save file', 500);
  }
};

export default { convertPDFToExcel, saveConvertedFile };
