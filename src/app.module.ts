import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
// import { UserModule } from './user/user.module';
// import { MailModule } from './mail/mail.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true,
    //   envFilePath: '.env'
    // }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     type: "postgres",
    //     host: config.get("DB_HOST"),
    //     port: config.get<number>('DB_PORT'),
    //     username: config.get('DB_USER'),
    //     password: config.get('DB_PASS'),
    //     database: config.get('DB_NAME'),
    //     autoLoadEntities: true,
    //     synchronize: true,
    //     logging: true,
    //   })
    // }),
    // AuthModule, UserModule, MailModule,
    TenantModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
