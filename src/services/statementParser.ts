import { Transaction } from './types';
import { parseTransactions } from './transactionParser';
import XLSX from 'xlsx';
import Papa from 'papaparse';
import ReactNativeBlobUtil from 'react-native-blob-util';

export async function parseExcelFile(uri: string): Promise<Transaction[]> {
  const base64 = await ReactNativeBlobUtil.fs.readFile(
    uri.replace('file://', ''),
    'base64',
  );
  const workbook = XLSX.read(base64, { type: 'base64' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  const rowStrings = rows.map(row => row.map(String).join('\t'));
  return parseTransactions(rowStrings);
}

export function parseCsvFile(uri: string): Promise<Transaction[]> {
  return ReactNativeBlobUtil.fs
    .readFile(uri.replace('file://', ''), 'utf8')
    .then(
      content =>
        new Promise<Transaction[]>((resolve, reject) => {
          Papa.parse(content, {
            header: false,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<string[]>) => {
              const rowStrings = (results.data as string[][]).map(row =>
                row.join('\t'),
              );
              resolve(parseTransactions(rowStrings));
            },
            error: (err: Error) => {
              reject(err);
            },
          });
        }),
    );
}

export function parsePdfRows(rows: string[]): Transaction[] {
  return parseTransactions(rows);
}
