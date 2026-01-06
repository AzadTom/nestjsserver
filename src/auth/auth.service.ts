import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { registerDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) { }
    async signup(registerDto: registerDto) {
        const saltOrRounds = 10;
        const password = registerDto.password;
        const hashed_password = await bcrypt.hash(password, saltOrRounds);

        const isFoundUser = await this.userService.findUser(registerDto);
        if(isFoundUser){
            return {
                message: 'User already exists'
            }
        }

        const user = await this.userService.createUser({ ...registerDto, password: hashed_password });
        const payload = { sub: user.id };
        const token = await this.jwtService.signAsync(payload);
        return { access_token: token };
    }

    async signin(registerDto: registerDto) {

        const { password } = registerDto;
        const user = await this.userService.findUser(registerDto);
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const payload = { sub: user.id };
                const token = await this.jwtService.signAsync(payload);
                return { access_token: token };
            }
            return {
                message: 'Invalid credentials'
            }
        }
        return {
            message: 'Invalid credentials'
        }
    }
}
