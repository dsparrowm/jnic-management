import { Module } from "@nestjs/common";
import { DirectoratesController } from "./directorates.controller";
import { DirectoratesService } from "./directorates.service";

@Module({
  controllers: [DirectoratesController],
  providers: [DirectoratesService],
  exports: [DirectoratesService],
})
export class DirectoratesModule {}
