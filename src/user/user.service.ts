import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { registerDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ){}

    
    async createUser(registerDto:registerDto) {
        const {email,password,username} = registerDto;
        const isExist = await this.userRepository.findOne({where:{email:email}});
        if(isExist){
           return {"message":"user already exist!"}; 
        }
        const user = this.userRepository.create({
            email,
            username,
            password,
        });
        await this.userRepository.save(user);
        return { "message": "user created!" };
    }
}
