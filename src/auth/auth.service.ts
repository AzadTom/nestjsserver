import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { registerDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService:UserService){}
    async register(registerDto:registerDto) {
        return await this.userService.createUser(registerDto);
    }
}
