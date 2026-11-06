import { Module } from "@geektech/backone/decorators";
import { HealthController } from "./health-controller";

@Module<HealthModule>({ controllers: (module) => [module.controller] })
export class HealthModule {
  readonly controller = new HealthController();
}
