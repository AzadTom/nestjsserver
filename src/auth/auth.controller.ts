import { Body, Controller, Get, Headers, Param, Post, Redirect, Render, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto, resetPasswordDto } from './dto/register.dto';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
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
    async signup(@Body() registerDto: registerDto, @Res({ passthrough: true }) res: Response) {
        const { access_token, refreash_token, message } = await this.authService.signup(registerDto);
        if (access_token && refreash_token) {
            res.cookie('refreash_token', refreash_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            return {
                access_token
            };
        }
        return {
            message
        };
    }

    @Post("/signin")
    async singin(@Body() registerDto: registerDto, @Res({ passthrough: true }) res: Response) {
        const { access_token, refreash_token, message } = await this.authService.signin(registerDto);

        if (access_token && refreash_token) {
            res.cookie('refreash_token', refreash_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            return {
                access_token
            };
        }
        return { message };
    }

    @Post("/signout")
    async signout(@Req() req: Request) {
        const token = req.cookies['refreash_token'];
        this.authService.signout(token);
    }

    @Get("/refresh-token")
    async refreashToken(@Req() req: Request) {
        const token = req.cookies['refreash_token'];
        this.authService.getNewAccessToken(token);
    }

}
