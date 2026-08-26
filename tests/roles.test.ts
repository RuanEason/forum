import assert from "node:assert/strict";
import test from "node:test";

import { toPublicUser } from "../src/lib/public-user";
import { isAdminRole } from "../src/lib/roles";

test("admin roles are recognized without exposing the internal role", () => {
  for (const role of ["admin", "super_admin"]) {
    assert.equal(isAdminRole(role), true);

    const publicUser = toPublicUser({ id: "user-1", name: "User", role });
    assert.equal(publicUser.isAdmin, true);
    assert.equal("role" in publicUser, false);
  }
});

test("non-admin, empty, and unknown roles are not administrators", () => {
  for (const role of ["user", "", "moderator", undefined, null]) {
    assert.equal(isAdminRole(role), false);
  }
});
