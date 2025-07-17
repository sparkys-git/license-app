const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting license migration...')

  // First, get or create a default application for existing licenses
  let defaultApp = await prisma.application.findFirst({
    where: { name: 'Default Application' }
  })

  if (!defaultApp) {
    defaultApp = await prisma.application.create({
      data: {
        name: 'Default Application',
        description: 'Default application for existing licenses',
        isActive: true,
      },
    })
    console.log('✅ Created default application for migration')
  } else {
    console.log('ℹ️  Default application already exists')
  }

  // Update all existing licenses that don't have an applicationId
  const licensesWithoutApp = await prisma.license.findMany({
    where: { applicationId: null }
  })

  if (licensesWithoutApp.length > 0) {
    console.log(`\n🔄 Updating ${licensesWithoutApp.length} licenses to use default application...`)
    
    await prisma.license.updateMany({
      where: { applicationId: null },
      data: { applicationId: defaultApp.id }
    })
    
    console.log('✅ All existing licenses now have an application assigned')
  } else {
    console.log('\nℹ️  All licenses already have applications assigned')
  }

  console.log('\n✅ Migration completed successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`   Default Application ID: ${defaultApp.id}`)
  console.log(`   Licenses updated: ${licensesWithoutApp.length}`)
  console.log('\n📋 Next steps:')
  console.log('   1. Make applicationId required in schema')
  console.log('   2. Run final migration: npx prisma db push')
}

main()
  .catch((e) => {
    console.error('Error in migration:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 