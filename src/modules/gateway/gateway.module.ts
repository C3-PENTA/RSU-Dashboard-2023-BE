import { Module } from "@nestjs/common";
import { GatewayService } from "./service/gateway.service";


@Module({
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
