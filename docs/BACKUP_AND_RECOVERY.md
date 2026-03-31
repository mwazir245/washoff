# WashOff Backup and Recovery

## What must be backed up
- PostgreSQL database
- environment secrets from the deployment secret manager
- generated deployment manifests or infrastructure configuration

If filesystem storage is used outside production, include:
- `data/object-storage`
- `data/mail-outbox-*`

## Production recommendation
- use managed PostgreSQL backups
- enable point-in-time recovery
- retain daily backups and test restores regularly

## Restore sequence
1. Restore the target PostgreSQL database snapshot.
2. Restore environment secrets.
3. Deploy the same WashOff application version or a schema-compatible version.
4. Run `npm run prisma:generate`.
5. Do **not** run destructive reset scripts.
6. Start the server and verify `GET /health`.
7. Validate a sample:
  - account login
  - hotel orders
  - provider active orders
  - finance document reads
  - document download routes

## Post-restore validation
- latest completed orders are present
- hotel invoices and provider statements are linked correctly
- finance statuses are intact
- session invalidation still works
- background jobs can be created and processed

## Disaster recovery notes
- prefer database mode only in production
- never allow fallback to file persistence in production
- keep rollback and restore steps versioned with the release
