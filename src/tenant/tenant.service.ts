import { Injectable } from '@nestjs/common';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import {  PaymentDto, SheetPayloadForRecordDto } from './dto/tenant.dto';
import { ColumnMapping, IUserInfo, toNumber, toString } from './utils/utils';

@Injectable()
export class TenantService {

    private doc: GoogleSpreadsheet;

    constructor() {
        this.loadDoc();
    }

    async loadDoc() {
        this.doc = new GoogleSpreadsheet("1ejDVgXq8VLU9tWbOQpOEzkdJ08ixNtrz7vCHIWJXroA", new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }));
        await this.doc.loadInfo();
    }


    async getTenantList() {
        const result = this.doc.sheetsByIndex.map((item) => ({ name: item.title, id: item.sheetId }));
        return { list: result };
    }

    async getDetailById(id: string) {
        const sheet = this.doc.sheetsById[id];
        if (sheet) {
            const rows = await sheet.getRows();
            const result = rows.map<IUserInfo>((r: any) => ({
                serial: toNumber(r.get(ColumnMapping.serial)),
                payment: toNumber(r.get(ColumnMapping.payment)),
                rent: toNumber(r.get(ColumnMapping.rent)),
                waterbill: toNumber(r.get(ColumnMapping.waterbill)),
                previous_month_bijli_unit: toNumber(r.get(ColumnMapping.previous_month_bijli_unit)),
                current_month_bijli_unit: toNumber(r.get(ColumnMapping.current_month_bijli_unit)),
                bijli_unit: toNumber(r.get(ColumnMapping.bijli_unit)),
                bijli_unit_price: toNumber(r.get(ColumnMapping.bijli_unit_price)),
                due: toNumber(r.get(ColumnMapping.due)),
                month: toString(r.get(ColumnMapping.month)),
                year: toNumber(r.get(ColumnMapping.year)),
                payment1_date: toString(r.get(ColumnMapping.payment1_date)),
                payment1_payment: toNumber(r.get(ColumnMapping.payment1_payment)),
                payment2_date: toString(r.get(ColumnMapping.payment2_date)),
                payment2_payment: toNumber(r.get(ColumnMapping.payment2_payment)),
                payment3_date: toString(r.get(ColumnMapping.payment3_date)),
                payment3_payment: toNumber(r.get(ColumnMapping.payment3_payment)),
            }));

            return {
                list: result
            }
        }
    }

    async addOrUpdateRecord(payload: SheetPayloadForRecordDto) {
        const { sheetid, data } = payload;

        const sheet = this.doc.sheetsById[sheetid];
        if (!sheet) throw new Error("Invalid sheet id");

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        const serialColumn = ColumnMapping.serial;
        const existingRow = rows.find(
            (r: any) => Number(r.get(serialColumn)) === Number(data.serial)
        );

        if (existingRow) {
            Object.entries(ColumnMapping).forEach(([key, column]) => {
                existingRow.set(column as string, (data as any)[key]);
            });

            await existingRow.save();
            return { message: "Row updated successfully" };
        }
        const newRow = Object.fromEntries(
            Object.entries(ColumnMapping).map(([key, column]) => [
                column,
                (data as any)[key],
            ])
        );

        await sheet.addRow(newRow);
        return { message: "Row created successfully" };
    }

    async deleteBySerial(sheetid: string, serial: string) {
        const sheet = this.doc.sheetsById[sheetid];
        if (!sheet) throw new Error("Invalid sheet id");

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        const serialColumn = ColumnMapping.serial;

        const rowToDelete = rows.find(
            (r: any) => Number(r.get(serialColumn)) === Number(serial)
        );

        if (!rowToDelete) {
            return { message: "No record found with this serial" };
        }

        await rowToDelete.delete();

        return { message: "Row deleted successfully" };
    }

    async addPaymentStatus(paymentPayload: PaymentDto) {
        const { sheetid, data } = paymentPayload;
        const { payment_amount, payment_date, payment_number, serial } = data;

        const sheet = this.doc.sheetsById[sheetid];
        if (!sheet) throw new Error("Invalid sheet id");

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        const rowToUpdate = rows.find(
            (r: any) => Number(r.get(ColumnMapping.serial)) === Number(serial)
        );

        if (!rowToUpdate) {
            return { message: "No record found with this serial" };
        }

        if (![1, 2, 3].includes(payment_number)) {
            throw new Error("payment_number must be 1, 2, or 3");
        }

        const dateKey = `payment${payment_number}_date` as keyof typeof ColumnMapping;
        const amountKey = `payment${payment_number}_payment` as keyof typeof ColumnMapping;

        rowToUpdate.set(ColumnMapping[dateKey], payment_date);
        rowToUpdate.set(ColumnMapping[amountKey], payment_amount);

        await rowToUpdate.save();

        return { message: `Payment ${payment_number} updated successfully` };
    }


}
