export class registerDto {
    username: string;
    email: string;
    password: string;
}

export class resetPasswordDto {
    token: string;
    password: string;
    comfirmpassword: string;
}