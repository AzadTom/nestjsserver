
export const ColumnMapping = {
    serial: "Sr. No.",
    payment: "Payment",
    rent: "Rent",
    waterbill: "Water Bill",
    previous_month_bijli_unit: "Previous Month Bijli Unit",
    current_month_bijli_unit: "Current Month Bijli Unit",
    bijli_unit: "Bijli Unit",
    bijli_unit_price: "Bijli Unit Price",
    due: "Due Rent",
    month: "Month",
    year: "Year",
    payment1_date: "payment1_date",
    payment1_payment: "payment1_amount",
    payment2_date: "payment2_date",
    payment2_payment: "payment2_amount",
    payment3_date: "payment3_date",
    payment3_payment: "payment3_amount",
}

export interface IUserInfo {
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

export const toNumber = (val: any): number =>
  val === "" || val == null ? 0 : Number(val);

export const toString = (val: any): string =>
  val ? String(val).trim() : "";
