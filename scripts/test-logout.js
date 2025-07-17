// Test script to verify logout functionality
const baseUrl = 'http://localhost:3000'
const adminPath = process.env.ADMIN_PATH || 'secure-admin-panel-xyz123'

async function testLogout() {
  console.log('🔓 Testing Logout Functionality\n')
  
  try {
    // Step 1: Login first
    console.log('1. Attempting login...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    })
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed - cannot test logout')
      return
    }
    
    // Extract the cookie from the response
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    const authCookie = setCookieHeader ? setCookieHeader.split(';')[0] : ''
    
    console.log('✅ Login successful');
    console.log(`   Cookie: ${authCookie}`)
    
    // Step 2: Verify we can access admin endpoints
    console.log('\n2. Testing admin access with cookie...')
    const adminResponse = await fetch(`${baseUrl}/api/admin/licenses`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    if (adminResponse.ok) {
      console.log('✅ Admin access works with cookie')
    } else {
      console.log('❌ Admin access failed with cookie')
      return
    }
    
    // Step 3: Logout
    console.log('\n3. Attempting logout...')
    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      }
    })
    
    if (logoutResponse.ok) {
      console.log('✅ Logout API call successful')
      
      // Check if logout response clears the cookie
      const logoutSetCookie = logoutResponse.headers.get('set-cookie')
      console.log(`   Set-Cookie header: ${logoutSetCookie}`)
      
      if (logoutSetCookie && logoutSetCookie.includes('Max-Age=0')) {
        console.log('✅ Logout response properly clears cookie')
      } else {
        console.log('⚠️  Logout response may not clear cookie properly')
      }
    } else {
      console.log('❌ Logout API call failed')
      return
    }
    
    // Step 4: Verify we can no longer access admin endpoints
    console.log('\n4. Testing admin access after logout...')
    const postLogoutResponse = await fetch(`${baseUrl}/api/admin/licenses`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    if (postLogoutResponse.status === 401) {
      console.log('✅ Admin access properly blocked after logout')
    } else {
      console.log('❌ Admin access still works after logout - session not cleared!')
      console.log(`   Status: ${postLogoutResponse.status}`)
    }
    
    // Step 5: Test with cleared cookie
    console.log('\n5. Testing admin access with cleared cookie...')
    const clearedCookieResponse = await fetch(`${baseUrl}/api/admin/licenses`, {
      headers: {
        'Cookie': 'auth-token=; Max-Age=0'
      }
    })
    
    if (clearedCookieResponse.status === 401) {
      console.log('✅ Admin access properly blocked with cleared cookie')
    } else {
      console.log('❌ Admin access still works with cleared cookie')
    }
    
    console.log('\n🎉 Logout test completed!')
    
  } catch (error) {
    console.error('❌ Logout test failed:', error.message)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testLogout().catch(console.error)
}

module.exports = { testLogout } 