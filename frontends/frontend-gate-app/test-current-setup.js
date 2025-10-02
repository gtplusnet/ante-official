// Test script to check current license setup
const licenseKey = "WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"; // from test scripts

async function testAPI() {
  console.log("Testing API endpoints...\n");
  
  // Test 1: Validate license
  console.log("1. Testing validate endpoint:");
  try {
    const validateRes = await fetch("https://backend-ante.geertest.com/auth/school/sync/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-License-Key": licenseKey
      }
    });
    const validateData = await validateRes.json();
    console.log("Validate response:", validateData);
  } catch (error) {
    console.log("Validate error:", error.message);
  }
  
  console.log("\n2. Testing status endpoint:");
  try {
    const statusRes = await fetch("https://backend-ante.geertest.com/auth/school/sync/status", {
      headers: {
        "X-License-Key": licenseKey
      }
    });
    const statusData = await statusRes.json();
    console.log("Status response:", statusData);
  } catch (error) {
    console.log("Status error:", error.message);
  }
}

testAPI();
