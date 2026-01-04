import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService:AuthService){}
    @Post("/register")
    async register(@Body() registerDto:registerDto){
        const result = await this.authService.register(registerDto);
        return result;
    }
}
