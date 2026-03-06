-- Update F1 2026 Calendar with session times and sprint weekend flags
-- This runs as a database admin, bypassing RLS

BEGIN;

-- Update all races with session times and lock times

-- Australian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-03-06T01:30:00Z',
  qualifying_time = '2026-03-07T05:00:00Z',
  lock_time = '2026-03-07T05:00:00Z',
  scheduled_start_time = '2026-03-08T04:00:00Z',
  finish_time = '2026-03-08T08:00:00Z'
WHERE id = 'race-aus';

-- Chinese Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-03-13T03:30:00Z',
  qualifying_time = '2026-03-13T07:00:00Z',
  sprint_qualifying_time = '2026-03-14T03:30:00Z',
  sprint_time = '2026-03-14T07:00:00Z',
  lock_time = '2026-03-14T03:30:00Z',
  scheduled_start_time = '2026-03-15T07:00:00Z',
  finish_time = '2026-03-15T11:00:00Z'
WHERE id = 'race-chn';

-- Japanese Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-03-27T02:30:00Z',
  qualifying_time = '2026-03-28T05:00:00Z',
  lock_time = '2026-03-28T05:00:00Z',
  scheduled_start_time = '2026-03-29T05:00:00Z',
  finish_time = '2026-03-29T09:00:00Z'
WHERE id = 'race-jpn';

-- Bahrain Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-04-10T12:30:00Z',
  qualifying_time = '2026-04-11T15:00:00Z',
  lock_time = '2026-04-11T15:00:00Z',
  scheduled_start_time = '2026-04-12T15:00:00Z',
  finish_time = '2026-04-12T19:00:00Z'
WHERE id = 'race-bhr';

-- Saudi Arabian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-04-17T14:30:00Z',
  qualifying_time = '2026-04-18T17:00:00Z',
  lock_time = '2026-04-18T17:00:00Z',
  scheduled_start_time = '2026-04-19T17:00:00Z',
  finish_time = '2026-04-19T21:00:00Z'
WHERE id = 'race-ksa';

-- Miami Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-05-01T16:30:00Z',
  qualifying_time = '2026-05-01T20:00:00Z',
  sprint_qualifying_time = '2026-05-02T16:30:00Z',
  sprint_time = '2026-05-02T20:00:00Z',
  lock_time = '2026-05-02T16:30:00Z',
  scheduled_start_time = '2026-05-03T19:00:00Z',
  finish_time = '2026-05-03T23:00:00Z'
WHERE id = 'race-mia';

-- Canadian Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-05-22T17:30:00Z',
  qualifying_time = '2026-05-22T21:00:00Z',
  sprint_qualifying_time = '2026-05-23T17:30:00Z',
  sprint_time = '2026-05-23T21:00:00Z',
  lock_time = '2026-05-23T17:30:00Z',
  scheduled_start_time = '2026-05-24T18:00:00Z',
  finish_time = '2026-05-24T22:00:00Z'
WHERE id = 'race-can';

-- Monaco Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-06-05T11:30:00Z',
  qualifying_time = '2026-06-06T13:00:00Z',
  lock_time = '2026-06-06T13:00:00Z',
  scheduled_start_time = '2026-06-07T13:00:00Z',
  finish_time = '2026-06-07T17:00:00Z'
WHERE id = 'race-mon';

-- Barcelona-Catalunya Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-06-12T11:30:00Z',
  qualifying_time = '2026-06-13T13:00:00Z',
  lock_time = '2026-06-13T13:00:00Z',
  scheduled_start_time = '2026-06-14T13:00:00Z',
  finish_time = '2026-06-14T17:00:00Z'
WHERE id = 'race-cat';

-- Austrian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-06-26T10:30:00Z',
  qualifying_time = '2026-06-27T13:00:00Z',
  lock_time = '2026-06-27T13:00:00Z',
  scheduled_start_time = '2026-06-28T13:00:00Z',
  finish_time = '2026-06-28T17:00:00Z'
WHERE id = 'race-aut';

-- British Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-07-03T11:30:00Z',
  qualifying_time = '2026-07-03T14:00:00Z',
  sprint_qualifying_time = '2026-07-04T11:30:00Z',
  sprint_time = '2026-07-04T14:00:00Z',
  lock_time = '2026-07-04T11:30:00Z',
  scheduled_start_time = '2026-07-05T14:00:00Z',
  finish_time = '2026-07-05T18:00:00Z'
WHERE id = 'race-gbr';

-- Belgian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-07-17T11:30:00Z',
  qualifying_time = '2026-07-18T13:00:00Z',
  lock_time = '2026-07-18T13:00:00Z',
  scheduled_start_time = '2026-07-19T13:00:00Z',
  finish_time = '2026-07-19T17:00:00Z'
WHERE id = 'race-bel';

-- Hungarian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-07-24T11:30:00Z',
  qualifying_time = '2026-07-25T13:00:00Z',
  lock_time = '2026-07-25T13:00:00Z',
  scheduled_start_time = '2026-07-26T13:00:00Z',
  finish_time = '2026-07-26T17:00:00Z'
WHERE id = 'race-hun';

-- Dutch Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-08-21T11:30:00Z',
  qualifying_time = '2026-08-21T13:00:00Z',
  sprint_qualifying_time = '2026-08-22T11:30:00Z',
  sprint_time = '2026-08-22T13:00:00Z',
  lock_time = '2026-08-22T11:30:00Z',
  scheduled_start_time = '2026-08-23T13:00:00Z',
  finish_time = '2026-08-23T17:00:00Z'
WHERE id = 'race-ned';

-- Italian Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-09-04T11:30:00Z',
  qualifying_time = '2026-09-05T13:00:00Z',
  lock_time = '2026-09-05T13:00:00Z',
  scheduled_start_time = '2026-09-06T13:00:00Z',
  finish_time = '2026-09-06T17:00:00Z'
WHERE id = 'race-ita';

-- Spanish Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-09-11T11:30:00Z',
  qualifying_time = '2026-09-12T13:00:00Z',
  lock_time = '2026-09-12T13:00:00Z',
  scheduled_start_time = '2026-09-13T13:00:00Z',
  finish_time = '2026-09-13T17:00:00Z'
WHERE id = 'race-esp';

-- Azerbaijan Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-09-24T08:30:00Z',
  qualifying_time = '2026-09-25T11:00:00Z',
  lock_time = '2026-09-25T11:00:00Z',
  scheduled_start_time = '2026-09-26T11:00:00Z',
  finish_time = '2026-09-26T15:00:00Z'
WHERE id = 'race-aze';

-- Singapore Grand Prix (SPRINT WEEKEND)
UPDATE global_races SET
  is_sprint_weekend = true,
  fp1_time = '2026-10-09T09:30:00Z',
  qualifying_time = '2026-10-09T12:00:00Z',
  sprint_qualifying_time = '2026-10-10T09:30:00Z',
  sprint_time = '2026-10-10T12:00:00Z',
  lock_time = '2026-10-10T09:30:00Z',
  scheduled_start_time = '2026-10-11T12:00:00Z',
  finish_time = '2026-10-11T16:00:00Z'
WHERE id = 'race-sgp';

-- United States Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-10-23T16:30:00Z',
  qualifying_time = '2026-10-24T19:00:00Z',
  lock_time = '2026-10-24T19:00:00Z',
  scheduled_start_time = '2026-10-25T19:00:00Z',
  finish_time = '2026-10-25T23:00:00Z'
WHERE id = 'race-usa';

-- Mexico City Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-10-30T17:30:00Z',
  qualifying_time = '2026-10-31T20:00:00Z',
  lock_time = '2026-10-31T20:00:00Z',
  scheduled_start_time = '2026-11-01T20:00:00Z',
  finish_time = '2026-11-02T00:00:00Z'
WHERE id = 'race-mex';

-- São Paulo Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-11-06T14:30:00Z',
  qualifying_time = '2026-11-07T17:00:00Z',
  lock_time = '2026-11-07T17:00:00Z',
  scheduled_start_time = '2026-11-08T17:00:00Z',
  finish_time = '2026-11-08T21:00:00Z'
WHERE id = 'race-bra';

-- Las Vegas Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-11-20T03:30:00Z',
  qualifying_time = '2026-11-21T06:00:00Z',
  lock_time = '2026-11-21T06:00:00Z',
  scheduled_start_time = '2026-11-22T06:00:00Z',
  finish_time = '2026-11-22T10:00:00Z'
WHERE id = 'race-lv';

-- Qatar Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-11-27T14:30:00Z',
  qualifying_time = '2026-11-28T17:00:00Z',
  lock_time = '2026-11-28T17:00:00Z',
  scheduled_start_time = '2026-11-29T17:00:00Z',
  finish_time = '2026-11-29T21:00:00Z'
WHERE id = 'race-qat';

-- Abu Dhabi Grand Prix (Normal weekend)
UPDATE global_races SET
  is_sprint_weekend = false,
  fp1_time = '2026-12-04T10:30:00Z',
  qualifying_time = '2026-12-05T13:00:00Z',
  lock_time = '2026-12-05T13:00:00Z',
  scheduled_start_time = '2026-12-06T13:00:00Z',
  finish_time = '2026-12-06T17:00:00Z'
WHERE id = 'race-uae';

COMMIT;

-- Verify the updates
SELECT 
  name,
  is_sprint_weekend,
  qualifying_time,
  sprint_qualifying_time,
  lock_time,
  scheduled_start_time
FROM global_races
ORDER BY scheduled_start_time;
