import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@repo/types";
import { ROLES_KEY } from "../common/decorators/roles.decorator";
import { DashboardController } from "./dashboard.controller";

test("restricts the HQ dashboard endpoint to HQ roles", () => {
  const roles = Reflect.getMetadata(
    ROLES_KEY,
    DashboardController.prototype.getHqDashboard,
  ) as Role[];

  assert.deepEqual(roles, [Role.ADMIN, Role.LEAD_PASTOR]);
  assert.equal(roles.includes(Role.BRANCH_PASTOR), false);
});

test("restricts the pastor dashboard endpoint to pastor roles", () => {
  const roles = Reflect.getMetadata(
    ROLES_KEY,
    DashboardController.prototype.getPastorDashboard,
  ) as Role[];

  assert.deepEqual(roles, [
    Role.BRANCH_PASTOR,
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
  ]);
  assert.equal(roles.includes(Role.ADMIN), false);
});
