/**
 * Test suite for phone number formatting
 * Run with: node test-phone-format.js (or similar test runner)
 */

import { formatKenyanPhoneNumber, isValidKenyanPhone, getPhoneProvider } from "../src/lib/mpesa";

// Test cases for phone number formatting
const testCases = [
  { input: "0712345678", expected: "254712345678", description: "Standard format with leading 0" },
  { input: "712345678", expected: "254712345678", description: "Without leading 0" },
  { input: "+254712345678", expected: "254712345678", description: "International format with +" },
  { input: "254712345678", expected: "254712345678", description: "Country code without +" },
  { input: "2547 12 34 56 78", expected: "254712345678", description: "With spaces" },
  { input: "0712-345-678", expected: "254712345678", description: "With hyphens" },
  { input: "0712 345 678", expected: "254712345678", description: "With spaces (local)" },
  { input: "0112345678", expected: "254112345678", description: "Airtel number" },
  { input: "0212345678", expected: "254212345678", description: "Telkom number" },
];

// Invalid test cases
const invalidCases = [
  { input: "0612345678", description: "Invalid prefix (6)" },
  { input: "07123456", description: "Too short" },
  { input: "071234567890", description: "Too long" },
  { input: "1234567890", description: "Invalid format" },
  { input: "abc123", description: "Contains letters" },
];

console.log("🧪 Testing Phone Number Formatting\n");
console.log("=" .repeat(60));

// Test valid cases
console.log("\n✅ VALID CASES:");
testCases.forEach((testCase, index) => {
  try {
    const result = formatKenyanPhoneNumber(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`\nTest ${index + 1}: ${testCase.description}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
    console.log(`  Status:   ${passed ? "✅ PASS" : "❌ FAIL"}`);
    
    // Test validator
    const isValid = isValidKenyanPhone(testCase.input);
    console.log(`  isValid:  ${isValid ? "✅" : "❌"}`);
    
    // Test provider detection
    const provider = getPhoneProvider(result);
    console.log(`  Provider: ${provider}`);
    
  } catch (error) {
    console.log(`\nTest ${index + 1}: ${testCase.description}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Status:   ❌ FAIL (Unexpected error)`);
    console.log(`  Error:    ${error instanceof Error ? error.message : error}`);
  }
});

// Test invalid cases
console.log("\n\n❌ INVALID CASES (Should Throw Errors):");
invalidCases.forEach((testCase, index) => {
  try {
    const result = formatKenyanPhoneNumber(testCase.input);
    console.log(`\nTest ${index + 1}: ${testCase.description}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Status:   ❌ FAIL (Should have thrown error, got: ${result})`);
  } catch (error) {
    console.log(`\nTest ${index + 1}: ${testCase.description}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Status:   ✅ PASS (Correctly rejected)`);
    console.log(`  Error:    ${error instanceof Error ? error.message : error}`);
  }
});

console.log("\n" + "=".repeat(60));
console.log("\n✨ Testing Complete!\n");

// Example usage
console.log("📱 Example Usage:\n");
console.log("const phone = '0712345678';");
console.log("const formatted = formatKenyanPhoneNumber(phone);");
console.log(`// Result: ${formatKenyanPhoneNumber('0712345678')}\n`);
