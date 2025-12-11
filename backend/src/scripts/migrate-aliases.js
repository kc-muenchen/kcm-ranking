import prisma from '../utils/db.js';

// Existing aliases from frontend config
const existingAliases = {
  'Phi': 'Phi Nguyen-Thien',
  'Andy': 'Andreas Metzke',
  'Andy M.': 'Andreas Metzke',
  'Jona': 'Jona Steffel',
  'Jonathan Steffel': 'Jona Steffel',
  'Moe': 'Manuel Butollo',
  'Tombo': 'Thomas Bonfert',
  'Nik': 'Nicki Preisinger',
  'Nikki': 'Nicki Preisinger',
  'Nik Preisinger': 'Nicki Preisinger',
  'David B.': 'David Brügger',
  'David': 'David Brügger',
  'David ': 'David Brügger',
  'Ludwig': 'Ludwig Bauer',
  'Lu': 'Ludwig Bauer',
  'Ludwig Ayrton Bauer': 'Ludwig Bauer',
  'Leon': 'Leon Straßberger',
  'Leon S.': 'Leon Straßberger',
  'Olli': 'Oliver Faro',
  'Olli F.': 'Oliver Faro',
  'Olli F': 'Oliver Faro',
  'olli': 'Oliver Faro',
  'Oli': 'Oliver Faro',
  'Daniel Zahreddin ': 'Daniel Zahreddin',
  'Hannah': 'Hannah Schramke',
  'Dima': 'Dzmitry Reznikau',
  'dima': 'Dzmitry Reznikau',
  'Franz ': 'Franz',
  'Mirco': 'Mirco Metz',
  'Mirco M.': 'Mirco Metz',
  'Vitalij ': 'Vitalij',
  'Vitali': 'Vitalij',
  'Faruk': 'Farroch Gholami',
  'Phil': 'Philipp',
  'Benjamin Stein': 'Ben',
  'Benjamin': 'Ben',
  'Wolfgang': 'Wolfgang S.',
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

