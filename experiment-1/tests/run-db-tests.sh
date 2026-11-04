#!/usr/bin/env bash
# =============================================================================
# experiment-1/tests/run-db-tests.sh: runs the database tests on a throwaway database
#
# Needs a local PostgreSQL server (not Supabase). Connection details come from the
# standard PG* settings, for example:
#   PGHOST=127.0.0.1 PGPORT=54330 PGUSER=postgres npm run test:db
# It creates a fresh database called exp1_test, adds the three roles Supabase
# has (anon, authenticated, service_role), runs the tests, then deletes it all.
# =============================================================================
set -euo pipefail   # stop at the first error

DB=exp1_test
psql -q -d postgres -c "drop database if exists $DB;"
psql -q -d postgres -c "create database $DB;"
# Supabase's built-in roles, so permissions can be tested as they will run live.
for role in anon authenticated service_role; do
  psql -q -d postgres -c "do \$\$ begin create role $role nologin; exception when duplicate_object then null; end \$\$;"
done
# Remove the throwaway database however the run ends.
cleanup() { psql -q -d postgres -c "drop database if exists $DB;" >/dev/null; }
trap cleanup EXIT

# Run the tests, keep the exit code (0 = all passed), and show only the results.
status=0
output=$(psql -q -v ON_ERROR_STOP=1 -d "$DB" -f experiment-1/tests/db.test.sql 2>&1) || status=$?
echo "$output" | grep -E "PASS|FAIL|ERROR|ALL DATABASE" | sed 's/^psql:[^ ]* NOTICE:  //'
exit $status
