import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { MonthlyClassSummary } from '@features/attendance/hooks/useMonthlyAttendance';
import { buildMonthlyReportHtml } from '@features/attendance/services/reportService';
import { StudentEntity } from '@features/students/types/student';

type GenerateMonthlyReportInput = {
  selectedMonth: Date;
  entries: MonthlyClassSummary[];
  studentLookup: Record<string, StudentEntity>;
  outputMode: 'download' | 'share';
};

const buildFileName = (selectedMonth: Date) => {
  const year = selectedMonth.getFullYear();
  const month = `${selectedMonth.getMonth() + 1}`.padStart(2, '0');
  return `attendance-report-${year}-${month}`;
};

const persistReportFile = async (temporaryUri: string, fileName: string) => {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) {
    return temporaryUri;
  }

  const destinationUri = `${documentsDirectory}${fileName}.pdf`;
  const destinationInfo = await FileSystem.getInfoAsync(destinationUri);

  if (destinationInfo.exists) {
    await FileSystem.deleteAsync(destinationUri, { idempotent: true });
  }

  await FileSystem.copyAsync({
    from: temporaryUri,
    to: destinationUri,
  });

  const persistedInfo = await FileSystem.getInfoAsync(destinationUri);
  if (!persistedInfo.exists) {
    throw new Error('Failed to persist generated PDF report');
  }

  return destinationUri;
};

const persistReportFileToUserSelectedFolder = async (temporaryUri: string, fileName: string, pdfBase64?: string) => {
  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted) {
    throw new Error('Download permission not granted');
  }

  const base64Content =
    pdfBase64 ??
    (await FileSystem.readAsStringAsync(temporaryUri, {
      encoding: FileSystem.EncodingType.Base64,
    }));

  const safeFileName = `${fileName}.pdf`;
  let destinationUri: string;

  try {
    destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      safeFileName,
      'application/pdf',
    );
  } catch {
    destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      `${fileName}-${Date.now()}.pdf`,
      'application/pdf',
    );
  }

  await FileSystem.writeAsStringAsync(destinationUri, base64Content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return destinationUri;
};

const persistDownloadReport = async ({
  temporaryUri,
  fileName,
  pdfBase64,
}: {
  temporaryUri: string;
  fileName: string;
  pdfBase64?: string;
}) => {
  if (Platform.OS === 'android') {
    return persistReportFileToUserSelectedFolder(temporaryUri, fileName, pdfBase64);
  }

  return persistReportFile(temporaryUri, fileName);
};

export const useGenerateReport = () => {
  const [isGeneratingReport, setGeneratingReport] = useState(false);

  const generateMonthlyReport = useCallback(
    async ({ selectedMonth, entries, studentLookup, outputMode }: GenerateMonthlyReportInput) => {
      setGeneratingReport(true);

      try {
        const html = buildMonthlyReportHtml({
          selectedMonth,
          entries,
          studentLookup,
        });

        const fileName = buildFileName(selectedMonth);
        const shouldGenerateBase64 = outputMode === 'download' && Platform.OS === 'android';
        const { uri, base64 } = await Print.printToFileAsync({ html, base64: shouldGenerateBase64 });

        if (outputMode === 'download') {
          return persistDownloadReport({
            temporaryUri: uri,
            fileName,
            pdfBase64: base64,
          });
        }

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          return uri;
        }

        const shareUri = await persistReportFile(uri, fileName);

        await Sharing.shareAsync(shareUri, {
          dialogTitle: `Share ${fileName}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });

        return shareUri;
      } finally {
        setGeneratingReport(false);
      }
    },
    [],
  );

  return {
    generateMonthlyReport,
    isGeneratingReport,
  };
};
