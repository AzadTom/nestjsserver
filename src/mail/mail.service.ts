import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendResetEmail(email: string, link: string) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset your password',
                html: `
          <p>You requested a password reset.</p>
          <p>
            <a href="${link}">Click here to reset your password</a>
          </p>
          <p>This link will expire in 15 minutes.</p>
        `,
            });

            return { message: 'Reset link sent to email' };

        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Email could not be sent');
        }
    }
}
