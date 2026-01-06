import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto } from './dto/register.dto';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService:AuthService){}
    @Post("/signup")
    async signup(@Body() registerDto:registerDto){
        const result = await this.authService.signup(registerDto);
        return result;
    }

    @Post("/signin")
    async singin(@Body () registerDto:registerDto){
        const result = await this.authService.signin(registerDto);
        return result; 
    }
}
