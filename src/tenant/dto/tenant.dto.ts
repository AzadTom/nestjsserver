export class PayloadForRecordDto {
    serial: number;
    payment: number;
    rent: number;
    waterbill: number;
    previous_month_bijli_unit: number;
    current_month_bijli_unit: number;
    bijli_unit: number;
    bijli_unit_price: number;
    due: number;
    month: string;
    year: number;
    payment1_date: string
    payment1_payment: number
    payment2_date: string
    payment2_payment: number
    payment3_date: string
    payment3_payment: number
}

export class SheetPayloadForRecordDto {
    sheetid: string
    data: PayloadForRecordDto
}

class PaymentData {
    serial: number;
    payment: boolean;
    payment_number: number;
    payment_date: string;
    payment_amount: string;
}

export class PaymentDto {
    sheetid: string;
    data: PaymentData;
}

