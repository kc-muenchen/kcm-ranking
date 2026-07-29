import prisma from '../utils/db.js';

const canonicalNameToAlias = {
  'Ali': ['Ali '],
  'Andreas Metzke': ['Andy', 'Andy M.'],
  'Axel Ignee': ['Axel'],
  'Basti': ['Basti S.'],
  'Ben': ['Benjamin Stein', 'Benjamin', 'Ben '],
  'Cederik Mulkers': ['Cederik'],
  'Christoph Hofmeister': ['Chris', 'Christoph'],
  'Daniel Zahreddin': ['Daniel Zahreddin '],
  'David Brügger': ['David B.', 'David', 'David '],
  'Dzmitry Reznikau': ['Dima', 'dima'],
  'Farroch Gholami': ['Faruk'],
  'Firas Hachi': ['firas', 'Firas', 'Firaz'],
  'Franz': ['Franz '],
  'Hannah Schramke': ['Hannah'],
  'Harald Munteanu': ['Harry', 'Dirty Harry'],
  'Jan-Hendrik Heilers': ['Jan'],
  'Johannes Metzlaff': ['Johannes', 'Hannes'],
  'Jona Steffel': ['Jona', 'Jonathan Steffel'],
  'Julian Mendler': ['julian Mendler'],
  'Konrad Pientka': ['Konrad'],
  'Leon Straßberger': ['Leon', 'Leon ', 'Leon S', 'Leon S.'],
  'Ludwig Bauer': ['Ludwig', 'Lu', 'Ludwig Ayrton Bauer'],
  'Manuel Butollo': ['Moe', ' Moe', 'Monz'],
  'Max': ['Maxx', 'maxx', 'Maxxx', 'maxxx', 'max'],
  'Mirco Metz': ['Mirco', 'Mirco M.'],
  'Nicki Preisinger': ['Nik', 'Nikki', 'Nik Preisinger'],
  'Oliver Faro': ['Olli', 'Olli ', 'Olli F.', 'Olli F', 'olli', 'Oli'],
  'Phi Nguyen-Thien': ['phi', 'Phi'],
  'Philipp': ['Phil', 'Phillipp'],
  'Stefan': ['Srefan'],
  'Sylvain': ['Sylvain '],
  'Thomas Bonfert': ['Tombo'],
  'Tibor Sas': ['Tibi'],
  'Timothee': ['Timothée', 'Timothy'],
  'Vitalij': ['Vitalij ', 'Vitali'],
  'Wolfgang S.': ['Wolfgang'],
  'Zeke': ['zeke']
};

function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return Array.from(duplicates);
}

async function migrateAliases() {
  console.log('🚀 Starting alias migration...\n');

  // Check for duplicate aliases
  const allAliases = Object.values(canonicalNameToAlias).flat();
  const duplicateAliases = findDuplicates(allAliases)
  if (duplicateAliases.length > 0) {
    console.error('❌ Error: Duplicate aliases found in configuration:');
    [...new Set(duplicateAliases)].forEach(alias => console.error(`   - "${alias}"`));
    throw new Error('Migration aborted due to duplicate aliases');
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const [canonicalName, aliases] of Object.entries(canonicalNameToAlias)) {
    // Try to find player by canonical name
    const player = await prisma.player.findUnique({
      where: { name: canonicalName }
    });

    for (const alias of aliases) {
      try {
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
        console.error(`❌ Error creating alias "${alias}" for "${canonicalName}":`, error.message);
        errors++;
      }
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
