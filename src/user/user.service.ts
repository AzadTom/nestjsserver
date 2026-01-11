import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { MoreThan, Repository } from 'typeorm';
import { registerDto } from 'src/auth/dto/register.dto';
import * as crypto from "crypto";

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }


    async createUser(registerDto: registerDto) {

        const { email, password, username } = registerDto;
        const isExist = await this.userRepository.findOne({ where: { email: email } });
        if (isExist) {
            return isExist;
        }
        const user = this.userRepository.create({
            email,
            username,
            password,
        });
        await this.userRepository.save(user);
        return user;
    }

    findUser = async (registerDto: registerDto) => {
        const user = await this.userRepository.findOne({ where: { email: registerDto.email } });
        return user;
    }

    findUserByToken = async (tokenHash: string) => {

        const user = await this.userRepository.findOne({
            where: {
                resetPasswordTokenHash: tokenHash,
                resetPasswordExpiresAt: MoreThan(new Date()),
            },
        });
        return user;
    }

    findUserByRefreashToken = async (tokenHash: string) => {

        const user = await this.userRepository.findOne({
            where: {
                refreshTokenHash: tokenHash,
                resetPasswordExpiresAt: MoreThan(new Date()),
            },
        });
        return user;
    }

    updateUser = async (user: User) => {
        return await this.userRepository.save(user);
    }

    saveTokenByUser = async (token: string, email: string) => {
        const user = await this.userRepository.findOne({ where: { email: email } });
        if (!user) {
            return { message: 'User not found' };
        }
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        user.resetPasswordTokenHash = tokenHash;
        user.resetPasswordExpiresAt = expiresAt;
        this.userRepository.save(user);
        return { message: 'Reset token saved successfully' };
    }

}
