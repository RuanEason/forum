import assert from "node:assert/strict";
import test from "node:test";

import {
  canManageUser,
  isAdminRole,
  isSessionVersionValid,
  isSuperAdminRole,
} from "../src/lib/server-auth";

const user = {
  id: "user-1",
  name: "User",
  role: "user",
  banned: false,
  sessionVersion: 0,
};

test("session version compatibility accepts legacy tokens and rejects stale tokens", () => {
  assert.equal(isSessionVersionValid(undefined, 0), true);
  assert.equal(isSessionVersionValid(0, 0), true);
  assert.equal(isSessionVersionValid(1, 0), false);
});

test("administrator policy prevents self-ban and peer administrator changes", () => {
  const admin = { ...user, id: "admin-1", role: "admin" };
  const peerAdmin = { ...user, id: "admin-2", role: "admin" };
  const target = { ...user, id: "user-2" };

  assert.equal(isAdminRole(admin.role), true);
  assert.equal(isSuperAdminRole(admin.role), false);
  assert.equal(canManageUser(admin, target), true);
  assert.equal(canManageUser(admin, admin), false);
  assert.equal(canManageUser(admin, peerAdmin), false);
});

test("super administrators can manage another administrator but not themselves", () => {
  const superAdmin = { ...user, id: "root-1", role: "super_admin" };
  const peerAdmin = { ...user, id: "admin-2", role: "admin" };

  assert.equal(isAdminRole(superAdmin.role), true);
  assert.equal(isSuperAdminRole(superAdmin.role), true);
  assert.equal(canManageUser(superAdmin, peerAdmin), true);
  assert.equal(canManageUser(superAdmin, superAdmin), false);
});
