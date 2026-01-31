import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PayloadForRecordDto, PaymentDto, SheetPayloadForRecordDto } from './dto/tenant.dto';

@Controller('tenant')
export class TenantController {

    constructor(private service: TenantService) { }

    @Get("/list")
    async getTenantList() {
        const result = await this.service.getTenantList();
        return result;
    }

    @Get("/list/:id")
    async getDetailById(@Param("id") id: string) {
        const result = await this.service.getDetailById(id);
        return result;
    }

    @Post("/add_new_record")
    async addOrUpdateR(@Body() payload: SheetPayloadForRecordDto) {
        const result = await this.service.addOrUpdateRecord(payload);
        return result;
    }

    @Post("/delete_record")
    async deleteRow(@Body("sheetid") sheetid: string, @Body("serial") serial: string) {
        const result = await this.service.deleteBySerial(sheetid, serial);
        return result;
    }

    @Post("/add_payment_status")
    async addPaymentStatus(@Body() paymentPayload:PaymentDto){
        const result = await this.service.addPaymentStatus(paymentPayload);
        return result;
    }
}
