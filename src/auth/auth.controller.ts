import { Body, Controller, Get, Headers, Param, Post, Redirect, Render, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto, resetPasswordDto } from './dto/register.dto';
import * as crypto from 'crypto';
import type { Request } from 'express';
import { MailService } from 'src/mail/mail.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService, private readonly mailService: MailService) { }

    @Post("/send-mail")
    async sendMail(@Req() req: Request, @Body("email") email: string) {

        const token = crypto.randomBytes(32).toString('hex');
        const host = req.get('host');
        const protocol = req.protocol;
        const resetLink = `${protocol}://${host}/auth/reset-password/${token}`;
        await this.authService.saveTokenByUser(token, email);
        await this.mailService.sendResetEmail(
            email,
            resetLink,
        );
    }

    @Get("/reset-password/:token")
    @Render("reset-password")
    forgetpasswordRender(@Param("token") token: string) {
        return { message: 'Reset your password', token };
    }




    @Post("/reset-password")
    @Redirect('/auth/success')
    async forget_password(@Body() resetPasswordDto: resetPasswordDto, @Res() res: Response) {
        return await this.authService.resetPassword(resetPasswordDto);
        
    }

    @Get("/success")
    @Render("success")
    success() {
        return { message: 'Your password has been reset successfully.' };
    }

    @Post("/signup")
    async signup(@Body() registerDto: registerDto) {
        const result = await this.authService.signup(registerDto);
        return result;
    }

    @Post("/signin")
    async singin(@Body() registerDto: registerDto) {
        const result = await this.authService.signin(registerDto);
        return result;
    }

    @Post("/signout")
    async signout(@Body() registerDto: registerDto) {
    }



}
