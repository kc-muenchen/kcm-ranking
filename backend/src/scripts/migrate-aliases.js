import prisma from '../utils/db.js';

// Existing aliases from frontend config
const existingAliases = {
  'Phi': 'Phi Nguyen-Thien',
  'Andy': 'Andreas Metzke',
  'Andy M.': 'Andreas Metzke',
  'Jona': 'Jona Steffel',
  'Moe': 'Manuel Butollo',
  'Tombo': 'Thomas Bonfert',
  'Nik': 'Nicki Preisinger',
  'Nikki': 'Nicki Preisinger',
  'Nik Preisinger': 'Nicki Preisinger',
  'David B.': 'David Brügger',
  'David': 'David Brügger',
};

async function migrateAliases() {
  console.log('🚀 Starting alias migration...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const [alias, canonicalName] of Object.entries(existingAliases)) {
    try {
      // Try to find player by canonical name
      const player = await prisma.player.findUnique({
        where: { name: canonicalName }
      });

      // Check if alias already exists
      const existing = await prisma.playerAlias.findUnique({
        where: { alias }
      });

      if (existing) {
        console.log(`⏭️  Skipped: "${alias}" → "${canonicalName}" (already exists)`);
        skipped++;
        continue;
      }

      // Create alias
      await prisma.playerAlias.create({
        data: {
          alias,
          canonicalName,
          playerId: player?.id || null
        }
      });

      console.log(`✅ Created: "${alias}" → "${canonicalName}"${player ? ` (linked to player)` : ''}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating alias "${alias}":`, error.message);
      errors++;
    }
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('📊 Migration Summary:');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ Created: ${created} aliases`);
  console.log(`⏭️  Skipped: ${skipped} aliases (already exist)`);
  console.log(`❌ Errors: ${errors} aliases`);
  console.log('\n🎉 Migration complete!');
}

migrateAliases()
  .catch((error) => {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

