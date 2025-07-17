// Test script to verify admin access security
const baseUrl = 'http://localhost:3000'
const adminPath = process.env.ADMIN_PATH || 'secure-admin-panel-xyz123'

async function testAccess(url, description) {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log(`${description}:`)
    console.log(`  URL: ${url}`)
    console.log(`  Status: ${response.status}`)
    console.log(`  Expected: ${description.includes('should be blocked') ? '404' : '200 or 302'}`)
    console.log(`  Result: ${description.includes('should be blocked') ? 
      (response.status === 404 ? '✅ PASSED' : '❌ FAILED') : 
      ([200, 302].includes(response.status) ? '✅ PASSED' : '❌ FAILED')
    }`)
    console.log('---')
  } catch (error) {
    console.log(`${description}: ❌ ERROR - ${error.message}`)
    console.log('---')
  }
}

async function runSecurityTests() {
  console.log('🔒 Testing Admin Access Security\n')
  console.log(`Admin Path: ${adminPath}\n`)
  
  // Test blocked direct access
  await testAccess(`${baseUrl}/`, 'Direct access to dashboard (should be blocked)')
  await testAccess(`${baseUrl}/login`, 'Direct access to login (should be blocked)')
  await testAccess(`${baseUrl}/applications`, 'Direct access to applications (should be blocked)')
  await testAccess(`${baseUrl}/validation-logs`, 'Direct access to validation logs (should be blocked)')
  
  // Test proper admin access
  await testAccess(`${baseUrl}/${adminPath}/`, 'Admin path dashboard access')
  await testAccess(`${baseUrl}/${adminPath}/login`, 'Admin path login access')
  await testAccess(`${baseUrl}/${adminPath}/applications`, 'Admin path applications access')
  await testAccess(`${baseUrl}/${adminPath}/validation-logs`, 'Admin path validation logs access')
  
  // Test public API access (should work)
  await testAccess(`${baseUrl}/api/licenses/validate`, 'Public API access (should work)')
  
  console.log('\n✅ Security test completed!')
  console.log(`\n📝 Admin Access URLs:`)
  console.log(`   Login: ${baseUrl}/${adminPath}/login`)
  console.log(`   Dashboard: ${baseUrl}/${adminPath}/`)
  console.log(`   Applications: ${baseUrl}/${adminPath}/applications`)
  console.log(`   Validation Logs: ${baseUrl}/${adminPath}/validation-logs`)
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSecurityTests().catch(console.error)
}

module.exports = { runSecurityTests } 