import { Injectable } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { PaymentDto, SheetPayloadForRecordDto } from './dto/tenant.dto';
import { ColumnMapping, IUserInfo, toNumber, toString } from './utils/utils';

@Injectable()
export class TenantService {

    private sheets: sheets_v4.Sheets;
    private initPromise: Promise<void>;

    private readonly spreadsheetId = '1ejDVgXq8VLU9tWbOQpOEzkdJ08ixNtrz7vCHIWJXroA';


    constructor() {
        this.initPromise = this.init();
    }

    private async init() {
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    private async ready() {
        await this.initPromise;
    }

    private async getSheetTitleById(sheetid: string) {
        const result = await this.getTenantList();
        const sheet = result.list?.find((item) => Number(item.id) === Number(sheetid));
        return sheet?.name;
    }


    async getTenantList() {

        await this.ready();
        const res = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: "sheets.properties",
        });
        const list = res.data.sheets?.map((s) => ({
            name: s.properties?.title,
            id: s.properties?.sheetId,
        }));
        return { list: list };
    }

    async getDetailById(sheetid: string) {
        await this.ready();
        const sheetTitle = await this.getSheetTitleById(sheetid);
        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A1:Z1000`,
        });

        const rows = res.data.values;
        if (!rows || rows.length < 2) return { list: [] };

        const headers = rows[0];
        const dataRows = rows.slice(1);
        const getIndex = (key: string) => headers.indexOf(key);

        const result = dataRows.map<IUserInfo>(row => ({
            serial: toNumber(row[getIndex(ColumnMapping.serial)]),
            payment: toNumber(row[getIndex(ColumnMapping.payment)]),
            rent: toNumber(row[getIndex(ColumnMapping.rent)]),
            waterbill: toNumber(row[getIndex(ColumnMapping.waterbill)]),
            previous_month_bijli_unit: toNumber(row[getIndex(ColumnMapping.previous_month_bijli_unit)]),
            current_month_bijli_unit: toNumber(row[getIndex(ColumnMapping.current_month_bijli_unit)]),
            bijli_unit: toNumber(row[getIndex(ColumnMapping.bijli_unit)]),
            bijli_unit_price: toNumber(row[getIndex(ColumnMapping.bijli_unit_price)]),
            due: toNumber(row[getIndex(ColumnMapping.due)]),
            month: toString(row[getIndex(ColumnMapping.month)]),
            year: toNumber(row[getIndex(ColumnMapping.year)]),
            payment1_date: toString(row[getIndex(ColumnMapping.payment1_date)]),
            payment1_payment: toNumber(row[getIndex(ColumnMapping.payment1_payment)]),
            payment2_date: toString(row[getIndex(ColumnMapping.payment2_date)]),
            payment2_payment: toNumber(row[getIndex(ColumnMapping.payment2_payment)]),
            payment3_date: toString(row[getIndex(ColumnMapping.payment3_date)]),
            payment3_payment: toNumber(row[getIndex(ColumnMapping.payment3_payment)]),
        }));

        return { list: result };
    }


    async addOrUpdateRecord(payload: SheetPayloadForRecordDto) {
        await this.ready();

        const { sheetid, data } = payload;
        const sheetTitle = await this.getSheetTitleById(sheetid);
        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A1:Z1000`,
        });

        const rows = res.data.values ?? [];
        if (rows.length === 0) throw new Error('Sheet has no header row');

        const headers = rows[0];
        const serialIndex = headers.indexOf(ColumnMapping.serial);

        if (serialIndex === -1) throw new Error('Serial column not found');


        const rowIndex = rows.findIndex(
            (r, i) => i > 0 && Number(r[serialIndex]) === Number(data.serial)
        );

        const rowValues = headers.map(h => (data as any)[Object.keys(ColumnMapping)
            .find(k => ColumnMapping[k] === h) ?? ''] ?? '');


        if (rowIndex !== -1) {
            const range = `${sheetTitle}!A${rowIndex + 1}`;

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowValues] },
            });

            return { message: 'Row updated successfully' };
        }

        await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowValues] },
        });

        return { message: 'Row created successfully' };
    }


    async deleteBySerial(sheetid: string, serial: string) {
        await this.ready();
        const sheetTitle = await this.getSheetTitleById(sheetid);
        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A1:Z1000`,
        });

        const rows = res.data.values ?? [];
        if (rows.length < 2) return { message: 'No data in sheet' };

        const headers = rows[0];
        const serialIndex = headers.indexOf(ColumnMapping.serial);

        if (serialIndex === -1) throw new Error('Serial column not found');

        const dataIndex = rows.findIndex(
            (r, i) => i > 0 && Number(r[serialIndex]) === Number(serial)
        );

        if (dataIndex === -1) {
            return { message: 'No record found with this serial' };
        }


        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: Number(sheetid),
                                dimension: 'ROWS',
                                startIndex: dataIndex,
                                endIndex: dataIndex + 1,
                            },
                        },
                    },
                ],
            },
        });

        return { message: 'Row deleted successfully' };
    }


    async addPaymentStatus(paymentPayload: PaymentDto) {
        await this.ready();

        const { sheetid, data } = paymentPayload;
        const { payment_amount, payment_date, payment_number, serial } = data;

        if (![1, 2, 3].includes(payment_number)) {
            throw new Error('payment_number must be 1, 2, or 3');
        }

        const sheetTitle = await  this.getSheetTitleById(sheetid);
        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A1:Z1000`,
        });

        const rows = res.data.values ?? [];
        if (rows.length < 2) return { message: 'No data in sheet' };

        const headers = rows[0];
        const serialIndex = headers.indexOf(ColumnMapping.serial);

        if (serialIndex === -1) throw new Error('Serial column not found');

        const rowIndex = rows.findIndex(
            (r, i) => i > 0 && Number(r[serialIndex]) === Number(serial)
        );

        if (rowIndex === -1) {
            return { message: 'No record found with this serial' };
        }

     
        const dateKey = `payment${payment_number}_date` as keyof typeof ColumnMapping;
        const amountKey = `payment${payment_number}_payment` as keyof typeof ColumnMapping;

        const dateColIndex = headers.indexOf(ColumnMapping[dateKey]);
        const amountColIndex = headers.indexOf(ColumnMapping[amountKey]);

        if (dateColIndex === -1 || amountColIndex === -1) {
            throw new Error('Payment columns not found');
        }

        const colToLetter = (col: number) =>
            String.fromCharCode(65 + col);

        const rowNumber = rowIndex + 1;

        const updates = [
            {
                range: `${sheetTitle}!${colToLetter(dateColIndex)}${rowNumber}`,
                values: [[payment_date]],
            },
            {
                range: `${sheetTitle}!${colToLetter(amountColIndex)}${rowNumber}`,
                values: [[payment_amount]],
            },
        ];

        await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: updates,
            },
        });

        return { message: `Payment ${payment_number} updated successfully` };
    }

}
