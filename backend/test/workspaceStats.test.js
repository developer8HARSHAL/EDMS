// tests/workspaceStats.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../app"); // ✅ pure app
const connectDB = require("../config/db");
const User = require("../models/userModel");
const Workspace = require("../models/workspaceModel");

let token;
let workspaceId;

beforeAll(async () => {
  // ✅ Connect only once
  await connectDB(process.env.TEST_DB_URI);

  // ✅ Clean up collections
  await User.deleteMany({});
  await Workspace.deleteMany({});

  // ✅ Create a test user
  const user = await User.create({
    name: "Test User",
    email: "harshalpinge@gmail.com",
    password: "harshal2" // make sure your model hashes or bypass hashing in test
  });

  // ✅ Generate JWT with same secret as app
  token = jwt.sign({ id: '68df3dbdb410b97a242cebe8' }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // ✅ Create a test workspace
 const ws = await Workspace.create({
  name: "Test Workspace",
  owner: '68df3dbdb410b97a242cebe8', // match your schema
  members: [{ user: '68df3dbdb410b97a242cebe8', role: "owner" }],
});


  workspaceId = ws._id.toString();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Workspace Stats API", () => {
  it("should return stats with correct structure", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/stats`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");

    const data = res.body.data;

    // ✅ check required keys
    expect(data).toHaveProperty("workspace");
    expect(data).toHaveProperty("documents");
    expect(data).toHaveProperty("members");

    // ✅ check nested structure
    expect(data.documents).toHaveProperty("total");
    expect(data.documents).toHaveProperty("totalSize");
    expect(data.documents).toHaveProperty("recentUploads");
    expect(data.members).toHaveProperty("total");
  });
});
