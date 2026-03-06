/**
 * Fetch F1 2026 Calendar Data from Ergast API and Update Database
 * 
 * This script fetches the F1 calendar from Ergast API and updates the database with:
 * - Session times (FP1, Qualifying, Sprint Qualifying, Sprint)
 * - Sprint weekend flags (auto-detected from API data)
 * - Proper lock times (qualifying or sprint qualifying)
 * 
 * Run with: node scripts/fetch-f1-calendar.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key for admin operations, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using anon key. Updates may fail due to RLS policies.');
  console.warn('   For admin operations, add SUPABASE_SERVICE_ROLE_KEY to .env file.');
  console.warn('   Get it from: Supabase Dashboard > Project Settings > API > service_role key\n');
} else {
  console.log('✅ Using service role key for admin operations\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Country name to flag emoji
const countryToFlag = {
  'Australia': '🇦🇺',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'Spain': '🇪🇸',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Monaco': '🇲🇨',
  'Austria': '🇦🇹',
  'UK': '🇬🇧',
  'Belgium': '🇧🇪',
  'Hungary': '🇭🇺',
  'Netherlands': '🇳🇱',
  'Italy': '🇮🇹',
  'Azerbaijan': '🇦🇿',
  'Singapore': '🇸🇬',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Qatar': '🇶🇦',
  'UAE': '🇦🇪',
  'Abu Dhabi': '🇦🇪',
};

// Normalize API country names to our standard short names
const countryNameMap = {
  'United States': 'USA',
  'United Kingdom': 'UK',
};

function normalizeCountryName(apiCountry) {
  return countryNameMap[apiCountry] || apiCountry;
}

async function fetchErgastCalendar() {
  console.log('🏎️  Fetching F1 2026 Calendar from Ergast API...\n');
  
  try {
    const response = await fetch('https://api.jolpi.ca/ergast/f1/2026/races/');
    const data = await response.json();
    
    const races = data.MRData.RaceTable.Races;
    const calendar = [];
    
    for (const race of races) {
      // Use round number for race ID (e.g., round "1" → "race-01")
      const raceId = `race-${String(race.round).padStart(2, '0')}`;
      
      // Check if this is a sprint weekend (has Sprint and SprintQualifying)
      const isSprint = !!(race.Sprint && race.SprintQualifying);
      
      // Parse session times
      const raceTime = `${race.date}T${race.time}`;
      const fp1Time = race.FirstPractice ? `${race.FirstPractice.date}T${race.FirstPractice.time}` : null;
      const qualifyingTime = race.Qualifying ? `${race.Qualifying.date}T${race.Qualifying.time}` : null;
      const sprintTime = race.Sprint ? `${race.Sprint.date}T${race.Sprint.time}` : null;
      const sprintQualifyingTime = race.SprintQualifying ? `${race.SprintQualifying.date}T${race.SprintQualifying.time}` : null;
      
      // Determine lock time: sprint qualifying for sprint weekends, regular qualifying otherwise
      const lockTime = (isSprint && sprintQualifyingTime) ? sprintQualifyingTime : qualifyingTime;
      
      // Get country and flag
      const apiCountry = race.Circuit.Location.country;
      const country = normalizeCountryName(apiCountry);
      const flagEmoji = countryToFlag[country] || countryToFlag[apiCountry] || '🏁';
      
      calendar.push({
        id: raceId,
        name: race.raceName,
        country: country,
        flagEmoji: flagEmoji,
        is_sprint_weekend: isSprint,
        fp1_time: fp1Time,
        qualifying_time: qualifyingTime,
        sprint_qualifying_time: sprintQualifyingTime,
        sprint_time: sprintTime,
        race_time: raceTime,
        lock_time: lockTime,
      });
    }
    
    return calendar;
  } catch (error) {
    console.error('❌ Error fetching from Ergast API:', error);
    throw error;
  }
}

async function updateCalendar() {
  const calendar = await fetchErgastCalendar();
  
  console.log(`\n📅 Found ${calendar.length} races. Updating database...\n`);

  for (const race of calendar) {
    // Calculate finish_time (4 hours after race start)
    const raceDate = new Date(race.race_time);
    const finishTime = new Date(raceDate.getTime() + 4 * 60 * 60 * 1000);

    const raceData = {
      id: race.id,
      name: race.name,
      country: race.country,
      flag_emoji: race.flagEmoji,
      scheduled_start_time: race.race_time,
      lock_time: race.lock_time,
      finish_time: finishTime.toISOString(),
      is_sprint_weekend: race.is_sprint_weekend,
      fp1_time: race.fp1_time,
      qualifying_time: race.qualifying_time,
      sprint_qualifying_time: race.sprint_qualifying_time,
      sprint_time: race.sprint_time,
      status: 'locked', // Default status for new races
    };

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('global_races')
      .upsert(raceData, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`❌ Error upserting ${race.name}:`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Details: ${JSON.stringify(error, null, 2)}`);
      console.error(`   Race ID: ${race.id}`);
    } else {
      const sprintBadge = race.is_sprint_weekend ? '🏁 SPRINT' : '';
      console.log(`✅ ${race.name} ${sprintBadge}`);
      console.log(`   Lock: ${new Date(race.lock_time).toLocaleString()}`);
    }
  }

  console.log('\n🏆 Calendar update complete!');
  console.log(`\n📊 Sprint weekends: ${calendar.filter(r => r.is_sprint_weekend).length}/${calendar.length} races`);
}

updateCalendar()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
