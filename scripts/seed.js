// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Check if default API key already exists
  let createdKey = await prisma.apiKey.findFirst({
    where: { name: 'Default API Key' }
  })

  let apiKey = null
  if (!createdKey) {
    // Generate a secure API key
    apiKey = crypto.randomBytes(32).toString('hex')
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

    // Create the API key record
    createdKey = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name: 'Default API Key',
        isActive: true,
      },
    })
    console.log('✅ API Key created')
  } else {
    console.log('ℹ️  API Key already exists')
  }

  // Check if admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: { username: 'jsparks' }
  })

  if (!adminUser) {
    // Create default admin user
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    adminUser = await prisma.user.create({
      data: {
        username: 'jsparks',
        password: hashedPassword,
        isActive: true,
      },
    })
    console.log('✅ Admin user created')
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Create sample applications (check if they exist first)
  const applicationData = [
    { name: 'PhotoEditor Pro', description: 'Professional photo editing software', isActive: true },
    { name: 'CodeMaster IDE', description: 'Advanced integrated development environment', isActive: true },
    { name: 'DataAnalyzer Suite', description: 'Business intelligence and data analysis tools', isActive: false },
  ]

  const applications = []
  for (const appData of applicationData) {
    let existingApp = await prisma.application.findFirst({
      where: { name: appData.name }
    })

    if (!existingApp) {
      const newApp = await prisma.application.create({
        data: appData,
      })
      applications.push(newApp)
      console.log(`✅ Application "${appData.name}" created`)
    } else {
      applications.push(existingApp)
      console.log(`ℹ️  Application "${appData.name}" already exists`)
    }
  }

  console.log('\n✅ Database seeded successfully!')
  
  console.log('\n🔑 API Key:')
  console.log('   Key ID:', createdKey.id)
  console.log('   Key Name:', createdKey.name)
  if (apiKey) {
    console.log('   Raw Key (use this in API calls):', apiKey)
  } else {
    console.log('   Raw Key: (already exists - check previous runs)')
  }
  
  console.log('\n👤 Admin User:')
  console.log('   Username: jsparks')
  console.log('   Password: admin123')
  console.log('   User ID:', adminUser.id)
  
  console.log('\n📱 Applications:')
  applications.forEach((app, index) => {
    console.log(`   ${index + 1}. ${app.name} (${app.isActive ? 'Active' : 'Inactive'})`)
  })
  
  console.log('\n⚠️  IMPORTANT: ')
  console.log('   1. Save the raw API key if it was newly generated!')
  console.log('   2. Change the admin password after first login')
  console.log('   3. Add the API key to your .env.local file as MASTER_API_KEY')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 