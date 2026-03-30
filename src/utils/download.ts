import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface DownloadExcelOptions {
  filename?: string;
  sheetName?: string;
}

export const downloadExcel = (
  data: Record<string, unknown>[],
  options?: DownloadExcelOptions,
) => {
  const { filename = "users_data.xlsx", sheetName = "Sheet1" } = options ?? {};

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(fileData, filename);
};