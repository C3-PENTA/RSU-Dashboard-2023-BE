import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NodeModule } from './modules/nodes/node.module';
import { TypeOrmConfigService } from './config/database/typeorm-config.service';
import { PolicyModule } from './modules/policy/policy.module';
import { PolicyManagerModule } from './modules/policy-manager/policy-manager.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitorModule } from './modules/monitor/monitor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ScheduleModule.forRoot(),
    NodeModule,
    PolicyModule,
    PolicyManagerModule,
    AuthModule,
    UsersModule,
    EventsModule,
    MonitorModule,
  ],
})
export class AppModule {}
