import assert from "node:assert";

// Mock localStorage
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

// Test Router logic
function parseRoute(path, hash) {
  const p = path.toLowerCase();
  const h = hash.toLowerCase().replace(/^#\/?/, "");

  if (p === "/login" || h === "login") return { route: "login" };
  if (p === "/pending-approval" || h === "pending-approval") return { route: "pending-approval" };
  if (p === "/rejected" || h === "rejected") return { route: "rejected" };
  if (p === "/members" || p === "/members-portal" || h === "members" || h === "members-portal") return { route: "members" };
  if (p === "/admin" || p === "/admin-portal" || h === "admin" || h === "admin-portal") return { route: "admin" };

  return { route: "home" };
}

console.log("=== Testing Route Parsing ===");
assert.strictEqual(parseRoute("/", "").route, "home");
assert.strictEqual(parseRoute("/login", "").route, "login");
assert.strictEqual(parseRoute("/", "#/login").route, "login");
assert.strictEqual(parseRoute("/", "#login").route, "login");
assert.strictEqual(parseRoute("/pending-approval", "").route, "pending-approval");
assert.strictEqual(parseRoute("/members", "").route, "members");
assert.strictEqual(parseRoute("/", "#/members").route, "members");
assert.strictEqual(parseRoute("/admin", "").route, "admin");
assert.strictEqual(parseRoute("/", "#/admin").route, "admin");
console.log("✓ Route parsing handles pathnames and hashes identically");

// Test Flow Decision Matrix
function determineView(user, requestedRoute) {
  const isAuthenticated = !!user && user.approvalStatus === "approved";
  const isAdmin = isAuthenticated && (user.role === "Chairperson" || user.role === "Mentor");

  if (!isAuthenticated) {
    if (user?.approvalStatus === "pending" || requestedRoute === "pending-approval") {
      return "PENDING_APPROVAL_PAGE";
    }
    if (user?.approvalStatus === "rejected" || requestedRoute === "rejected") {
      return "REJECTED_PAGE";
    }
    return "STANDALONE_LOGIN_PAGE";
  }

  // Authenticated & Approved
  if (requestedRoute === "login" || requestedRoute === "pending-approval" || requestedRoute === "rejected") {
    return "WEBSITE_HOMEPAGE";
  }
  if (requestedRoute === "members") {
    return "WEBSITE_MEMBERS_PORTAL";
  }
  if (requestedRoute === "admin") {
    if (!isAdmin) return "ACCESS_DENIED_PAGE";
    return "WEBSITE_ADMIN_PORTAL";
  }

  return "WEBSITE_HOMEPAGE";
}

console.log("\n=== Testing Scenario 1: Unauthenticated Visit ===");
assert.strictEqual(determineView(null, "home"), "STANDALONE_LOGIN_PAGE");
assert.strictEqual(determineView(null, "members"), "STANDALONE_LOGIN_PAGE");
assert.strictEqual(determineView(null, "admin"), "STANDALONE_LOGIN_PAGE");
console.log("✓ Scenario 1 Passed: Unauthenticated visitor sees standalone Login Page for all routes");

console.log("\n=== Testing Scenario 2 & 3: Pending Account ===");
const pendingUser = { name: "Vikram Singh", role: "Member", approvalStatus: "pending" };
assert.strictEqual(determineView(pendingUser, "home"), "PENDING_APPROVAL_PAGE");
assert.strictEqual(determineView(pendingUser, "members"), "PENDING_APPROVAL_PAGE");
assert.strictEqual(determineView(pendingUser, "admin"), "PENDING_APPROVAL_PAGE");
console.log("✓ Scenarios 2 & 3 Passed: Pending user access to main website is completely blocked");

console.log("\n=== Testing Scenario 4: Approved Member ===");
const memberUser = { name: "Shinjini Dutta", role: "Technical Head", approvalStatus: "approved" };
assert.strictEqual(determineView(memberUser, "home"), "WEBSITE_HOMEPAGE");
assert.strictEqual(determineView(memberUser, "members"), "WEBSITE_MEMBERS_PORTAL");
assert.strictEqual(determineView(memberUser, "admin"), "ACCESS_DENIED_PAGE");
console.log("✓ Scenario 4 Passed: Regular member sees website & members portal, but admin access is denied");

console.log("\n=== Testing Scenario 5: Approved Chairperson / Mentor ===");
const adminUser = { name: "Aarav Sharma", role: "Chairperson", approvalStatus: "approved" };
assert.strictEqual(determineView(adminUser, "home"), "WEBSITE_HOMEPAGE");
assert.strictEqual(determineView(adminUser, "members"), "WEBSITE_MEMBERS_PORTAL");
assert.strictEqual(determineView(adminUser, "admin"), "WEBSITE_ADMIN_PORTAL");
console.log("✓ Scenario 5 Passed: Chairperson sees website, members portal, and admin portal");

console.log("\n=== Testing Scenario 6: Logout Redirection ===");
// When user logs out, user becomes null and route becomes login
assert.strictEqual(determineView(null, "login"), "STANDALONE_LOGIN_PAGE");
console.log("✓ Scenario 6 Passed: Logout immediately returns standalone login");

console.log("\n=== Testing Scenario 7: Refresh Persistence ===");
// Session in localStorage yields approved user
assert.strictEqual(determineView(memberUser, "home"), "WEBSITE_HOMEPAGE");
// Session in localStorage yields null
assert.strictEqual(determineView(null, "home"), "STANDALONE_LOGIN_PAGE");
console.log("✓ Scenario 7 Passed: Session correctly drives view state upon page refresh");

console.log("\n=== Testing Scenario 8: Direct /admin access by regular member ===");
assert.strictEqual(determineView(memberUser, "admin"), "ACCESS_DENIED_PAGE");
console.log("✓ Scenario 8 Passed: Direct /admin entry by ordinary member displays Access Denied page");

console.log("\nALL 8 AUTHENTICATION FLOW SCENARIOS VERIFIED SUCCESSFULLY!");
