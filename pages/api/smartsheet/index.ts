import { NextApiRequest, NextApiResponse } from 'next';
import { Sheet, ListResult, Row } from '../../../utils/typings'; // Adjust the import path as necessary
import * as Smartsheet from 'smartsheet';
import csv from 'csvtojson';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const smartsheet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.body;

  const parsedQuery = parseFunctionString(query);
  const { functionName, params } = parsedQuery;

  const sheetId = Number(params[0]);
  const rowId = Number(params[1]);

  function parseFunctionString(str: string) {
    const regex = /^(\w+)\((.*)\)$/;
    const match = str.match(regex);
    if (!match) {
      return { functionName: 'undefined', params: 'undefined' }
    }
    const [, functionName, paramsStr] = match;
    const params = paramsStr.split(',').map(param => param.trim());
    return { functionName, params };
  }

  const smartsheet = new Smartsheet.createClient({ accessToken: process.env.SMARTSHEET_KEY });

  // Get a list of sheets
  async function listSheets(): Promise<ListResult<Sheet>> {
    try {
      const response = await smartsheet.sheets.listSheets();
      return response;
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  // Get a sheet by ID
  async function getSheetById(sheetId: number) {
    var response: any = '';
    try {
      response = await smartsheet.sheets.getSheet({ sheetId });
    } catch (error: any) {
      console.error(error);
      throw error;
    }
    return response;
  };

  // Get rows from a sheet
  async function getSheetRows(sheetId: number, rowId: number): Promise<Array<Row>> {
    const result = smartsheet.sheets.getRow({ sheetId, rowId })
      .then(function (row: any) {
        return row;
      })
      .catch(function (error: any) {
        return error;
      });
    return result;
  };

  // Get rows from a sheet as JSON
  async function getSheetAsJSON(sheetId: number) {
    const result: { json: any, csv: string } = { json: '', csv: '' };
    if (sheetId) {
      await smartsheet.sheets.getSheetAsCSV({
        id: sheetId,
        format: 'csv', // or 'excel'
        downloadPath: './sheet.csv', // or './sheet.xlsx' for Excel
      })
        .then((response: any) => {
          result.csv = response;
        })
        .catch((error: any) => {
          console.error('Error downloading sheet:', error);
        });
    }
    if (result?.csv !== '') {
      await csv({
        noheader: false,
        output: 'json'
      }).fromString(result.csv).then((response: any) => {
        result.json = response;
      })
    };

    return result;
  };

  // Write Sheet to CSV
  async function writeToCSV(sheetId: number) {
    const result: { json: any, csv: string } = { json: '', csv: '' };
    if (sheetId) {
      await smartsheet.sheets.getSheetAsCSV({
        id: sheetId,
        format: 'csv',
        downloadPath: './sheet.csv',
      })
        .then((response: any) => {
          result.csv = response;
        })
        .catch((error: any) => {
          console.error('Error downloading sheet:', error);
        });
    }
    if (result?.csv !== '') {
      await csv({
        noheader: false,
        output: 'json'
      }).fromString(result.csv).then((response: any) => {
        result.json = response;
      })
    };
    if (result.csv) {
      const lines = result.csv.split('\n');
      const writeStream = fs.createWriteStream('output.csv');
      lines.forEach((line: any) => {
        // Split each line into fields
        const fields = line.split(',');
        // Write the fields to the CSV file
        writeStream.write(fields.join(',') + '\n');
      });
      writeStream.end();
    };
    return { message: 'SUCCESS writing output.csv' };
  };

  const options: any = {
    getSheetRows: await getSheetRows(sheetId, rowId),
    getSheetAsJSON: await getSheetAsJSON(sheetId),
    getSheetById: await getSheetById(sheetId),
    writeToCSV: await writeToCSV(sheetId),
    listSheets: await listSheets()
  };

  let response: any;

  if (query && options.hasOwnProperty(functionName)) {
    response = options[functionName];
  } else {
    response = { message: 'no query' }
  }

  console.log(`🔵[smartsheet]: ${query}`);
  res.status(200).json(response);
};

export default smartsheet;
