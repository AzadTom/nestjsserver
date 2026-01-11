import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { registerDto, resetPasswordDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) { }
    async signup(registerDto: registerDto) {
        const saltOrRounds = 10;
        const password = registerDto.password;
        const hashed_password = await bcrypt.hash(password, saltOrRounds);

        const isFoundUser = await this.userService.findUser(registerDto);
        if (isFoundUser) {
            return {
                message: 'User already exists'
            }
        }

        const user = await this.userService.createUser({ ...registerDto, password: hashed_password });
        const payload = { sub: user.id };
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: '15m'
        });

        const refreash_token = crypto.randomBytes(32).toString('hex');
        const refreash_token_hash = crypto
            .createHash('sha256')
            .update(refreash_token)
            .digest('hex');

        const refreash_token_expires_At = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        user.refreshTokenHash = refreash_token_hash;
        user.resetPasswordExpiresAt = refreash_token_expires_At;
        this.userService.updateUser(user);
        return { access_token: token, refreash_token: refreash_token_hash };
    }

    async signin(registerDto: registerDto) {

        const { password } = registerDto;
        const user = await this.userService.findUser(registerDto);
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const payload = { sub: user.id };
                const token = await this.jwtService.signAsync(payload);

                const refreash_token = crypto.randomBytes(32).toString('hex');
                const refreash_token_hash = crypto
                    .createHash('sha256')
                    .update(refreash_token)
                    .digest('hex');

                const refreash_token_expires_At = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                user.refreshTokenHash = refreash_token_hash;
                user.resetPasswordExpiresAt = refreash_token_expires_At;
                this.userService.updateUser(user);
                return { access_token: token, refreash_token: refreash_token_hash };
            }
            return {
                message: 'Invalid credentials'
            }
        }
        return {
            message: 'Invalid credentials'
        }
    }

    async saveTokenByUser(token: string, email: string) {
        return await this.userService.saveTokenByUser(token, email);
    }

    async resetPassword(resetPasswordDto: resetPasswordDto) {

        const { token, password, comfirmpassword } = resetPasswordDto;

        if (password !== comfirmpassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await this.userService.findUserByToken(tokenHash);

        if (!user) {
            throw new BadRequestException('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpiresAt = null;
        await this.userService.updateUser(user);

        return true;

    }

    async getNewAccessToken(refreash_token: string) {

        const user = await this.userService.findUserByRefreashToken(refreash_token);
        if (user) {
            const payload = { sub: user.id };
            const token = await this.jwtService.signAsync(payload);
            return { access_token: token };
        }

        return {
            message: 'refreash_token expired',
        }
    }

    async signout(token: string) {
        const user = await this.userService.findUserByRefreashToken(token);
        if (user) {
            user.refreshTokenHash = null;
            user.resetPasswordExpiresAt = null;
            await this.userService.updateUser(user);
        }
        return {
            message: 'User logged out successfully.'
        }
    }


}
