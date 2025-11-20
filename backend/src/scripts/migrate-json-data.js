import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { processTournamentData } from '../services/tournament-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Migrates all JSON tournament files to the database
 */
async function migrateJsonData() {
  try {
    console.log('🚀 Starting data migration from JSON files...\n');

    // Path to dummy_data folder
    const dataPath = path.join(__dirname, '../../../dummy_data');
    
    // Read all JSON files
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📁 Found ${jsonFiles.length} JSON files to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each file
    for (const file of jsonFiles) {
      try {
        console.log(`📄 Processing: ${file}...`);
        
        const filePath = path.join(dataPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Process and save tournament data
        await processTournamentData(data);

        console.log(`   ✅ Successfully migrated: ${data.name}\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error processing ${file}:`, error.message, '\n');
        errorCount++;
        errors.push({ file, error: error.message });
      }
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} tournaments`);
    console.log(`❌ Failed: ${errorCount} tournaments`);
    
    if (errors.length > 0) {
      console.log('\n🔍 Errors:');
      errors.forEach(e => {
        console.log(`   - ${e.file}: ${e.error}`);
      });
    }

    console.log('\n🎉 Migration complete!\n');

    // Show database stats
    const [tournamentCount, playerCount, matchCount] = await Promise.all([
      prisma.tournament.count(),
      prisma.player.count(),
      prisma.match.count()
    ]);

    console.log('📈 Database Statistics:');
    console.log(`   Tournaments: ${tournamentCount}`);
    console.log(`   Players: ${playerCount}`);
    console.log(`   Matches: ${matchCount}`);

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateJsonData();

