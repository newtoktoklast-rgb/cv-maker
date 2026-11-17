import crypto from "crypto";

const key = crypto.randomBytes(32).toString("hex");

console.log("=================================================");
console.log("🔑 Generated Secure MCP API Key:");
console.log(`\n${key}\n`);
console.log("Add this to your Next.js '.env.local':");
console.log(`MCP_SECRET_API_KEY=${key}`);
console.log("\nAnd in your AI client MCP configuration:");
console.log(`"MCP_API_KEY": "${key}"`);
console.log("=================================================");

